/**
 * Blood Bowl Rules & Economics Utility Functions
 */

export const parseCurrency = (str) => {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    return parseInt(str.toString().replace(/\D/g, '')) || 0;
};

export const formatCurrency = (num) => {
    const val = parseInt(num) || 0;
    return `${val.toLocaleString()} gold`;
};

/**
 * Calculates the Sideline Value of a team for Team Value calculations.
 * In Blood Bowl rules:
 * - Rerolls add (rerolls * baseRerollCost)
 * - Cheerleaders add (cheerleaders * 10,000)
 * - Assistant Coaches add (assistantCoaches * 10,000)
 * - Apothecary adds 50,000 if hired
 */
export const calculateSidelineValue = (team) => {
    if (!team) return 0;
    const rerolls = (parseInt(team.rerolls) || 0) * (parseInt(team.rerollCost) || 60000);
    const cheerleaders = (parseInt(team.cheerleaders) || 0) * (parseInt(team.cheerleaderCost) || 10000);
    const coaches = (parseInt(team.assistantCoaches) || 0) * (parseInt(team.assistantCoachCost) || 10000);
    const apothecary = (team.apothecary ? 1 : 0) * (parseInt(team.apothecaryCost) || 50000);
    return rerolls + cheerleaders + coaches + apothecary;
};

/**
 * Calculates Team Value (TV) for a team.
 * Includes all active and injured players (who are still on the roster).
 * Dead players (status === 'dead') DO NOT count towards TV.
 */
export const calculateTeamValue = (team, playersList = []) => {
    if (!team) return 0;
    const activePlayers = (playersList || []).filter(p => p.status !== 'dead');
    const playerTotal = activePlayers.reduce((sum, p) => sum + parseCurrency(p.cost), 0);
    const sidelineTotal = calculateSidelineValue(team);
    return playerTotal + sidelineTotal;
};

/**
 * Calculates Current Team Value (CTV) for an upcoming match.
 * Excludes injured players who are Missing the Next Game (MNG) or dead players.
 */
export const calculateCurrentTeamValue = (team, playersList = []) => {
    if (!team) return 0;
    const availablePlayers = (playersList || []).filter(p => p.status === 'active');
    const playerTotal = availablePlayers.reduce((sum, p) => sum + parseCurrency(p.cost), 0);
    const sidelineTotal = calculateSidelineValue(team);
    return playerTotal + sidelineTotal;
};

/**
 * Calculates Petty Cash given to underdog team:
 * Petty cash = max(0, higher_CTV - lower_CTV)
 */
export const calculatePettyCash = (teamA_CTV, teamB_CTV) => {
    const diff = Math.abs((teamA_CTV || 0) - (teamB_CTV || 0));
    if (diff === 0) return { pettyCashA: 0, pettyCashB: 0 };
    if ((teamA_CTV || 0) < (teamB_CTV || 0)) {
        return { pettyCashA: diff, pettyCashB: 0 };
    }
    return { pettyCashA: 0, pettyCashB: diff };
};

/**
 * Determines whether a team is considered finalized (in active season play).
 */
export const isTeamFinalized = (team, tournament, matches = []) => {
    if (team?.confirmed === true) return true;
    if (tournament && tournament.status !== 'Recruiting') return true;
    if (matches && matches.some(m => (m.teamA === team?.id || m.teamB === team?.id) && m.status === 'played')) {
        return true;
    }
    return false;
};

/**
 * Returns the reroll purchase cost based on whether the team is finalized.
 * Post-finalization rerolls cost 2x the base race cost.
 */
export const getRerollPurchaseCost = (team, finalized) => {
    const baseCost = parseInt(team?.rerollCost) || 60000;
    return finalized ? baseCost * 2 : baseCost;
};

/**
 * Blood Bowl Advancement SPP Costs & TV increases (BB2020 / Third Season Edition rules)
 * Tiers: 1st through 6th advancement
 */
export const ADVANCEMENT_TIERS = [
    { advNum: 1, randomPrimary: 3, chosenPrimary: 6, chosenSecondary: 10, characteristic: 14 },
    { advNum: 2, randomPrimary: 4, chosenPrimary: 8, chosenSecondary: 12, characteristic: 16 },
    { advNum: 3, randomPrimary: 6, chosenPrimary: 12, chosenSecondary: 16, characteristic: 20 },
    { advNum: 4, randomPrimary: 8, chosenPrimary: 16, chosenSecondary: 20, characteristic: 24 },
    { advNum: 5, randomPrimary: 10, chosenPrimary: 20, chosenSecondary: 24, characteristic: 28 },
    { advNum: 6, randomPrimary: 15, chosenPrimary: 30, chosenSecondary: 34, characteristic: 38 },
];

export const ADVANCEMENT_TV_INCREASE = {
    randomPrimary: 20000,
    chosenPrimary: 20000,
    chosenSecondary: 40000,
    characteristic_av: 10000,
    characteristic_ma: 20000,
    characteristic_pa: 20000,
    characteristic_ag: 30000,
    characteristic_st: 60000
};

export const getAdvancementCostAndValue = (advancementCount, type) => {
    const clampedIndex = Math.min(Math.max(0, advancementCount), ADVANCEMENT_TIERS.length - 1);
    const tier = ADVANCEMENT_TIERS[clampedIndex];
    
    let sppCost = 6;
    let tvIncrease = 20000;

    switch (type) {
        case 'randomPrimary':
            sppCost = tier.randomPrimary;
            tvIncrease = ADVANCEMENT_TV_INCREASE.randomPrimary;
            break;
        case 'chosenPrimary':
            sppCost = tier.chosenPrimary;
            tvIncrease = ADVANCEMENT_TV_INCREASE.chosenPrimary;
            break;
        case 'chosenSecondary':
            sppCost = tier.chosenSecondary;
            tvIncrease = ADVANCEMENT_TV_INCREASE.chosenSecondary;
            break;
        case 'characteristic_av':
            sppCost = tier.characteristic;
            tvIncrease = ADVANCEMENT_TV_INCREASE.characteristic_av;
            break;
        case 'characteristic_ma':
            sppCost = tier.characteristic;
            tvIncrease = ADVANCEMENT_TV_INCREASE.characteristic_ma;
            break;
        case 'characteristic_pa':
            sppCost = tier.characteristic;
            tvIncrease = ADVANCEMENT_TV_INCREASE.characteristic_pa;
            break;
        case 'characteristic_ag':
            sppCost = tier.characteristic;
            tvIncrease = ADVANCEMENT_TV_INCREASE.characteristic_ag;
            break;
        case 'characteristic_st':
            sppCost = tier.characteristic;
            tvIncrease = ADVANCEMENT_TV_INCREASE.characteristic_st;
            break;
        default:
            sppCost = tier.chosenPrimary;
            tvIncrease = ADVANCEMENT_TV_INCREASE.chosenPrimary;
    }

    return { sppCost, tvIncrease, advNum: tier.advNum };
};

export const getTotalRounds = (format, teamCount, cycles = 2) => {
    const n = parseInt(teamCount) || 0;
    if (n < 2) return 0;

    // Odd team counts get a bye slot, so every team plays n rounds instead of n-1
    const rrRounds = n % 2 === 0 ? n - 1 : n;

    switch (format) {
        case 'Round Robin':        return rrRounds;
        case 'Multi Round Robin':  return rrRounds * (cycles || 2);
        case 'Swiss':              return Math.ceil(Math.log2(n));
        case 'Single Elimination': return Math.ceil(Math.log2(n));
        case 'Double Elimination': return Math.ceil(Math.log2(n)) * 2; // approximation, see note below
        default:                   return 0;
    }
};

export const fallbackRound = (ms) => {
    const upcoming = ms.filter(m => m.status === 'upcoming');
    return upcoming.length
        ? Math.min(...upcoming.map(m => m.round))
        : Math.max(...ms.map(m => m.round), 1);
};