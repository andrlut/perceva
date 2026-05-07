/**
 * English translations.
 *
 * Keys are namespaced by feature/screen. Keep groups small and predictable —
 * if a group grows past ~30 entries, split it.
 *
 * For dynamic interpolation use `{name}` placeholders, e.g.
 *   greeting.morning: 'Good morning, {name}'
 *
 * For pluralization use the i18n-js convention:
 *   tasks.count: { one: '1 task', other: '{count} tasks' }
 */
const en = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    confirm: 'Confirm',
    loading: 'Loading…',
    retry: 'Retry',
    yes: 'Yes',
    no: 'No',
    error: 'Something went wrong',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    optional: 'optional',
    skip: 'Skip',
    none: 'None',
    all: 'All',
    add: 'Add',
    remove: 'Remove',
    archive: 'Archive',
    unarchive: 'Unarchive',
    create: 'Create',
    update: 'Update',
  },

  auth: {
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in to continue your journey',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      forgot: 'Forgot password?',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      magicLink: 'Send magic link',
      checkEmail: 'Check your email for the link to sign in',
    },
    signup: {
      title: 'Create your account',
      submit: 'Sign up',
      hasAccount: 'Already have an account?',
      signIn: 'Sign in',
    },
    forgot: {
      title: 'Reset password',
      subtitle: "Enter your email and we'll send a reset link",
      submit: 'Send reset link',
      sent: 'If the email is registered, a reset link is on the way.',
    },
    reset: {
      title: 'Choose a new password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      submit: 'Update password',
      mismatch: "Passwords don't match",
      tooShort: 'Password must be at least 8 characters',
      success: 'Password updated. Welcome back.',
    },
    errors: {
      invalidCredentials: 'Invalid email or password',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      generic: 'Sign-in failed. Please try again.',
    },
    signOut: 'Sign out',
  },

  onboarding: {
    skip: 'Skip',
    next: 'Next',
    start: 'Start',
    slide1: {
      title: 'Six dimensions, twelve pillars',
      body: 'Health, Strength, Mind, Wealth, Bonds, Craft. Two pillars each. The shape of a balanced life.',
    },
    slide2: {
      title: 'Tasks earn XP',
      body: 'Every task you complete grants XP to the dimensions it touches. Hard things grow you faster.',
    },
    slide3: {
      title: 'Rewards close the loop',
      body: 'Spend coins on rewards you actually want. The game is honest only if both sides feel real.',
    },
  },

  tabs: {
    home: 'Home',
    character: 'Character',
    rewards: 'Rewards',
    profile: 'Profile',
  },

  home: {
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night',
    },
    sections: {
      today: 'Today',
      upcoming: 'Upcoming',
      anytime: 'Anytime',
      completed: 'Completed today',
      empty: 'Nothing here yet',
      addTask: 'Add a task',
    },
    streak: {
      label: 'Streak',
      days: { one: '{count} day', other: '{count} days' },
      best: 'Best: {count}',
      atRisk: 'At risk',
    },
    completedDrawer: {
      title: 'Completed today',
      empty: 'Complete your first task to see it here.',
      undo: 'Undo',
      addExtra: '+ Extra',
      unskip: 'Unskip',
    },
    pullToRefresh: 'Pull to refresh',
  },

  tasks: {
    new: 'New task',
    edit: 'Edit task',
    fields: {
      title: 'Title',
      titlePlaceholder: 'What do you want to do?',
      difficulty: 'Difficulty',
      dimensions: 'Dimensions',
      dimensionsHint: 'Pick up to 3 dimensions this task grows.',
      schedule: 'Schedule',
      target: 'Target per period',
      targetHint: 'How many times per period this task counts toward your goal.',
    },
    schedule: {
      oneShot: 'One-shot',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      everyDay: 'Every day',
      weekDays: 'Selected days',
      monthDay: 'Day of month',
    },
    actions: {
      complete: 'Complete',
      skip: 'Skip today',
      unskip: 'Unskip',
      logExtra: 'Log extra',
      undo: 'Undo',
      archive: 'Archive',
      unarchive: 'Unarchive',
      delete: 'Delete',
      confirmDelete: 'Delete this task? This cannot be undone.',
      confirmHighDifficulty: 'This is a {stars}-star task. Mark complete?',
    },
    difficultyLabel: {
      1: 'Trivial',
      2: 'Easy',
      3: 'Steady',
      4: 'Hard',
      5: 'Heroic',
    },
    history: {
      title: 'History',
      empty: 'No history yet',
      tapToLog: 'Tap a past day to log a retroactive completion.',
      logFor: 'Log for {date}',
      removeEntry: 'Remove this entry?',
    },
  },

  rewards: {
    title: 'Rewards',
    new: 'New reward',
    edit: 'Edit reward',
    fields: {
      title: 'Title',
      titlePlaceholder: 'What do you want to earn?',
      cost: 'Cost (coins)',
      icon: 'Icon',
      category: 'Category',
    },
    categories: {
      indulgence: 'Indulgence',
      good: 'Good',
      experience: 'Experience',
    },
    actions: {
      redeem: 'Redeem',
      confirmRedeem: 'Spend {cost} coins on "{title}"?',
      archive: 'Archive',
      unarchive: 'Unarchive',
      delete: 'Delete',
      confirmDelete: 'Delete this reward?',
    },
    insufficient: 'Not enough coins. You need {short} more.',
    coins: { one: '{count} coin', other: '{count} coins' },
    history: {
      title: 'Redemption history',
      empty: 'No redemptions yet',
    },
    bank: {
      title: 'Suggestions',
      subtitle: 'Tap to add to your shop.',
      added: 'Added',
    },
  },

  character: {
    title: 'Character',
    level: 'Level',
    xp: 'XP',
    coins: 'Coins',
    sections: {
      stats: 'Stats',
      pillars: 'Pillars',
      weights: 'Weights',
      skills: 'Skills',
      profile: 'Profile',
    },
    weights: {
      label: 'Weight',
      hint: 'How much this pillar matters to you, from 1 to 5 stars.',
    },
    selfAssessment: {
      title: 'Self-assessment',
      subtitle: 'Tap to update your gut-check.',
      cta: 'Update self-assessment',
      lastUpdated: 'Last updated {when}',
    },
    questionnaire: {
      cta: 'Take the questionnaire',
      lastTaken: 'Last taken {when}',
      never: 'Never taken',
      due: 'Due now',
    },
  },

  dimensions: {
    health: 'Health',
    strength: 'Strength',
    mind: 'Mind',
    wealth: 'Wealth',
    bonds: 'Bonds',
    craft: 'Craft',
  },

  subs: {
    sleep: 'Sleep',
    nutrition: 'Nutrition',
    movement: 'Movement',
    dexterity: 'Dexterity',
    learn: 'Learn',
    contemplate: 'Contemplate',
    money: 'Money',
    career: 'Career',
    circle: 'Circle',
    romance: 'Romance',
    play: 'Play',
    build: 'Build',
  },

  profile: {
    title: 'Profile',
    sections: {
      account: 'Account',
      preferences: 'Preferences',
      notifications: 'Notifications',
      data: 'Data',
      about: 'About',
    },
    fields: {
      displayName: 'Display name',
      email: 'Email',
      avatar: 'Avatar',
      theme: 'Theme',
      language: 'Language',
      weekStart: 'Week starts on',
      confirmHighDifficulty: 'Confirm 4★/5★ completions',
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
    weekStart: {
      sunday: 'Sunday',
      monday: 'Monday',
    },
    notifications: {
      master: 'Notifications',
      daily: 'Daily reminder',
      quest: 'Quest deadline',
      streak: 'Streak at risk',
    },
    actions: {
      replayOnboarding: 'Replay onboarding',
      signOut: 'Sign out',
      confirmSignOut: 'Sign out of this device?',
    },
    version: 'Version {version}',
  },

  skills: {
    title: 'Skills',
    new: 'New skill',
    edit: 'Edit skill',
    fields: {
      name: 'Name',
      unit: 'Unit',
      dimension: 'Dimension',
      icon: 'Icon',
    },
    log: {
      cta: 'Log a PR',
      placeholder: 'New best',
      submit: 'Save PR',
      success: 'New PR logged',
    },
    tier: {
      beginner: 'Beginner',
      bronze: 'Bronze',
      silver: 'Silver',
      gold: 'Gold',
      master: 'Master',
    },
    history: {
      title: 'PR history',
      empty: 'No PRs logged yet',
    },
  },

  quests: {
    title: 'Quests',
    new: 'New quest',
    sections: {
      active: 'Active',
      completed: 'Completed',
      failed: 'Failed',
    },
    fields: {
      title: 'Title',
      deadline: 'Deadline',
      reward: 'Reward',
      requirements: 'Requirements',
    },
    status: {
      active: 'Active',
      completed: 'Completed',
      failed: 'Failed',
      expired: 'Expired',
      abandoned: 'Abandoned',
    },
    actions: {
      complete: 'Claim reward',
      abandon: 'Abandon',
      confirmAbandon: 'Abandon this quest?',
    },
    progress: '{done} / {total}',
    daysLeft: { one: '{count} day left', other: '{count} days left' },
    overdue: 'Overdue',
    empty: 'No quests yet. Pick a template to start.',
    templates: {
      title: 'Quest templates',
      start: 'Start quest',
    },
  },

  selfAssessment: {
    title: 'Self-assessment',
    subtitle: 'Where do you feel each pillar is right now?',
    pillarPrompt: 'How is your {pillar}?',
    scale: {
      0: 'Not at all',
      1: 'Barely',
      2: 'Some',
      3: 'Decent',
      4: 'Solid',
      5: 'Great',
    },
    save: 'Save self-assessment',
    saved: 'Self-assessment updated',
  },

  questionnaire: {
    title: 'Questionnaire',
    intro: {
      title: 'Periodic check-in',
      body: 'A deeper read on each pillar. Plan for {minutes} minutes.',
      cta: 'Begin',
    },
    progress: '{current} of {total}',
    submit: 'Submit',
    submitting: 'Saving…',
    result: {
      title: 'Your results',
      subtitle: 'How the questionnaire compares to your self-assessment.',
      delta: 'Δ {delta}',
      bucketLabel: {
        attention_overestimating: 'Attention — possible blind spot',
        slight_overestimate: 'Slightly overestimating',
        aligned: 'Aligned',
        slight_underestimate: 'Slightly underestimating',
        attention_underestimating: 'Attention — possibly underestimating',
      },
    },
  },

  errors: {
    network: 'Network error. Check your connection and try again.',
    notAuthenticated: 'You need to be signed in for this.',
    notFound: 'Not found',
    unknown: 'Unexpected error. Try again.',
  },

  format: {
    listSeparator: ', ',
    rangeSeparator: ' – ',
  },
};

export default en;

/**
 * Recursive shape that preserves the structure of `en` but allows any string
 * value at the leaves — so other locales must match the shape without being
 * forced to use the same English text.
 */
type DeepString<T> = T extends string
  ? string
  : T extends (infer U)[]
    ? DeepString<U>[]
    : { [K in keyof T]: DeepString<T[K]> };

export type Translations = DeepString<typeof en>;
