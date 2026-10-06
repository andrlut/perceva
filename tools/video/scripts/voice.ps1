# Voz PROVISÓRIA do Manifesto — sintetizador do próprio Windows (offline, sem
# custo, sem API). Serve só pra marcar o tempo de cada cena; a voz final é
# gravada pelo André, fala por fala, com os mesmos nomes de arquivo.
#
#   npm run voice            -> public/vo/<id>.wav + public/vo/timings.json
#
# Para trocar pela voz real: grave cada linha de src/script.json como
# public/vo/<id>.wav (mono ou estéreo, qualquer taxa) e rode
#   npm run voice -- -MeasureOnly
# que só remede as durações sem sintetizar nada.

param([switch]$MeasureOnly, [int]$Rate = 1)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $root 'src/script.json'
$voDir = Join-Path $root 'public/vo'
New-Item -ItemType Directory -Force $voDir | Out-Null

$script = Get-Content $scriptPath -Raw -Encoding UTF8 | ConvertFrom-Json

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'pt-BR' } | Select-Object -First 1
if (-not $voice -and -not $MeasureOnly) { throw 'Nenhuma voz pt-BR instalada no Windows.' }
if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }
$synth.Rate = $Rate

function Get-WavSeconds([string]$path) {
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $byteRate = [BitConverter]::ToInt32($bytes, 28)
  # procura o chunk "data" (pula LIST/fact quando existem)
  $i = 12
  while ($i -lt $bytes.Length - 8) {
    $id = [System.Text.Encoding]::ASCII.GetString($bytes, $i, 4)
    $size = [BitConverter]::ToInt32($bytes, $i + 4)
    if ($id -eq 'data') { return [math]::Round($size / $byteRate, 3) }
    $i += 8 + $size
  }
  throw "WAV sem chunk data: $path"
}

$timings = @()
foreach ($line in $script.lines) {
  $wav = Join-Path $voDir ($line.id + '.wav')
  if (-not $MeasureOnly) {
    $text = $line.caption
    if ($line.say) { $text = $line.say }
    $text = $text.Replace('*', '')  # *palavra* = destaque dourado na legenda
    $fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(44100, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
    $synth.SetOutputToWaveFile($wav, $fmt)
    $synth.Speak($text)
    $synth.SetOutputToNull()
  }
  $secs = Get-WavSeconds $wav
  $timings += [pscustomobject]@{ id = $line.id; seconds = $secs }
  Write-Host ("{0,-9} {1,6:N2}s" -f $line.id, $secs)
}
$synth.Dispose()

$json = ConvertTo-Json -InputObject $timings
[System.IO.File]::WriteAllText((Join-Path $voDir 'timings.json'), $json, (New-Object System.Text.UTF8Encoding($false)))
$total = ($timings | Measure-Object -Property seconds -Sum).Sum
Write-Host ("total de fala: {0:N1}s" -f $total)
