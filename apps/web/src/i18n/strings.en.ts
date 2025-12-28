// FILE: apps/web/src/i18n/strings.en.ts
export const en = {
  appName: "PR Calculator",
  nav: {
    home: "Home",
    movements: "Movements",
    preferences: "Preferences",
  },
  home: {
    loading: "Loading…",
    maxWeight: "Max (100%)",
    unit: "Unit",
    range: "Percent range",
    from: "From",
    to: "To",
    step: "Step",
    platesPerSide: "Plates / side",
    perSideTotal: "Per side total",
    bar: "Bar",
    achieved: "Achieved",

    // NEW: custom %
    customPercent: "Custom %",
    customPercentPlaceholder: "e.g. 87.5",
    customPercentAdd: "Add",
    customPercentAddAria: "Add custom percent",
    customPercentAdded: "Added custom percents",
    customPercentRemove: "Remove",
    customPercentHint: "Add a one-off % for this session.",

    // NEW: snap / rounding
    snapTitle: "Snap to plates",
    snapAria: "Toggle snap to plates",
    snapHintOff: "Keeps results loadable",
    snapDelta: "Δ",
    snapStep: "step",
  },
  prefs: {
    unit: "Unit",
    barWeight: "Bar weight",
    rounding: "Rounding",
    plates: "Available plates (per side, comma-separated)",
    save: "Save",
    saved: "✅ Saved",
    contexts: {
      title: "Contexts",
      kg: "KG context",
      lb: "LB context",
      olympic: "Olympic",
      crossfit: "CrossFit",
      custom: "Custom (use my plates)",
    },
    presets: {
      title: "Plate presets",
      olympicKg: "Olympic (KG)",
      crossfitLb: "CrossFit (LB + KG change plates)",
      applied: "Preset applied",

      // NEW (for PreferencesPage UI)
      selectedTitle: "Selected",
      olympicHint: "{bar}{unit} bar, {unit} plates",
      crossfitHint: "{bar}{unit} bar, {unit} plates + kg change",
    },
    theme: {
      title: "Theme",
      current: "Current",
      toggleRowAria: "Toggle theme",
      switchToLightAria: "Switch to light theme",
      switchToDarkAria: "Switch to dark theme",
      lightTitle: "Light",
      darkTitle: "Dark",
    },
    bar: {
      title: "Bar",
      genderTitle: "Bar type",
      genderHint: "Select the bar used for calculations",
      genderToggleAria: "Select bar type",
      male: "Men’s bar",
      female: "Women’s bar",
      currentTitle: "Current",
      currentHint: "Current bar weight",
    },

    // NEW (for PreferencesPage UI)
    backup: {
      title: "Backup",
      exportTitle: "Export",
      exportHint: "Save a JSON backup.",
      exportAria: "Export backup",
      importTitle: "Import",
      importHint: "Restore from a JSON backup.",
      importAria: "Import backup",
      exportError: "Could not export backup",
      importError: "Could not import backup (invalid file?)",
    },
    support: {
      title: "Support",
      idTitle: "ID",
      copyFullTitle: "Copy full ID",
      copyAria: "Copy support ID",
      unknownId: "unknown",
    },
  },
  movements: {
    placeholder: "e.g. Back Squat",
    filterPlaceholder: "Filter movements…",
    clearFilterAria: "Clear filter",
    closeAria: "Close",

    emptyHint: "No movements yet. Add your first one 👇",
    noMatches: "No matches for",
    showing: "Showing",
    of: "of",
    tapHint: "Tap Open calculator to start from your best lift.",
    noPrYet: "No PR yet — tap Manage PRs to add one",

    openCalculator: "Open calculator",
    managePrs: "Manage PRs",

    delete: "delete",

    sort: {
      title: "Sort",
      aria: "Sort movements",
      recentActivity: "Recent activity",
      createdNewest: "Created (newest)",
      createdOldest: "Created (oldest)",
      nameAZ: "Name (A–Z)",
      nameZA: "Name (Z–A)",
      bestPrWeight: "Best PR (weight)",
    },

    create: {
      aria: "Add movement",
      title: "New movement",
      nameLabel: "Name",
      createCta: "Create",
      cancelCta: "Cancel",
      errorEmpty: "Please enter a name",
    },
  },
  movement: {
    title: "Movement",
    prs: "PR entries",
    prsTitle: "PRs",

    weight: "Weight",
    reps: "Reps",
    date: "Date",

    add: "Add PR",
    save: "Save",
    cancel: "Cancel",

    delete: "delete",
    back: "← Back",
    loading: "Loading…",
    empty: "No PR entries yet.",
    savedIn: "Saved in",

    editAria: "Edit PR",
    deleteAria: "Delete PR",

    errors: {
      invalidWeight: "Invalid weight",
      invalidReps: "Invalid reps",
      invalidDate: "Invalid date",
      saveFailed: "Could not save PR",
      updateFailed: "Could not save changes",
    },

    confirm: {
      deleteEntryTitle: "Delete PR?",
      deleteEntryBody: "Delete PR {date} · {weight} × {reps}?",
      deleteEntryCta: "Delete PR",

      deleteMovementTitle: "Delete movement?",
      deleteMovementBody: "Delete “{name}”? This will remove its PRs too.",
      deleteMovementCta: "Delete movement",

      cancelCta: "Cancel",
    },
  },
  context: {
    label: "Context",
    olympic: "Olympic",
    crossfit: "CrossFit",
    custom: "Custom",
  },
  warmup: {
    title: "Warm-up",
    subtitle:
      "Suggested sets based on your target (snapped to plates when possible).",
    target: "Target",
    template: "Template",
    reps: "{reps} reps",
    roundedFrom: "from {w}",
    deltaLabel: "Δ",
    templates: {
      crossfit: "CrossFit (simple)",
      strength: "Strength (gradual)",
      olympic: "Olympic (quick)",
    },
    platesPerSide: "Plates/side:",
  },
} as const;
