import { describe, it, expect } from 'vitest';
import {
    calculateTeamValue,
    calculateCurrentTeamValue,
    calculateSidelineValue,
    calculatePettyCash,
    isTeamFinalized,
    getRerollPurchaseCost,
    getAdvancementCostAndValue,
    parseCurrency
} from '../utils/bbRules';

describe('Blood Bowl Rules & Economics (bbRules)', () => {
    const mockTeam = {
        id: 'team1',
        rerolls: 2,
        rerollCost: 60000,
        cheerleaders: 1,
        cheerleaderCost: 10000,
        assistantCoaches: 1,
        assistantCoachCost: 10000,
        apothecary: true,
        apothecaryCost: 50000,
        treasury: '150,000 gold'
    };

    const mockPlayers = [
        { id: 'p1', number: 1, name: 'Player 1', cost: '100,000 gold', status: 'active', spp: 10 },
        { id: 'p2', number: 2, name: 'Player 2', cost: '80,000 gold', status: 'injured', spp: 6 },
        { id: 'p3', number: 3, name: 'Player 3', cost: '70,000 gold', status: 'dead', spp: 15 },
        { id: 'p4', number: 4, name: 'Player 4', cost: '50,000 gold', status: 'active', spp: 0 },
    ];

    it('calculates sideline value correctly', () => {
        // 2*60k (120k) + 1*10k + 1*10k + 50k = 190,000
        const sideline = calculateSidelineValue(mockTeam);
        expect(sideline).toBe(190000);
    });

    it('calculates full Team Value (excluding dead players, including injured)', () => {
        // Active: p1 (100k), p4 (50k)
        // Injured: p2 (80k) -> counts towards TV
        // Dead: p3 (70k) -> does NOT count towards TV
        // Total players: 100k + 80k + 50k = 230,000
        // Sideline: 190,000
        // TV = 420,000
        const tv = calculateTeamValue(mockTeam, mockPlayers);
        expect(tv).toBe(420000);
    });

    it('calculates Current Team Value (excluding dead AND injured players)', () => {
        // Active only: p1 (100k), p4 (50k) = 150,000
        // Sideline: 190,000
        // CTV = 340,000
        const ctv = calculateCurrentTeamValue(mockTeam, mockPlayers);
        expect(ctv).toBe(340000);
    });

    it('calculates petty cash correctly for underdogs', () => {
        const teamA_CTV = 1000000;
        const teamB_CTV = 1150000;
        const result = calculatePettyCash(teamA_CTV, teamB_CTV);
        expect(result.pettyCashA).toBe(150000);
        expect(result.pettyCashB).toBe(0);

        const equalResult = calculatePettyCash(1000000, 1000000);
        expect(equalResult.pettyCashA).toBe(0);
        expect(equalResult.pettyCashB).toBe(0);
    });

    it('determines team finalization and double reroll cost', () => {
        const preTeam = { ...mockTeam, confirmed: false };
        const recruitingTournament = { status: 'Recruiting' };
        expect(isTeamFinalized(preTeam, recruitingTournament, [])).toBe(false);
        expect(getRerollPurchaseCost(preTeam, false)).toBe(60000);

        const inProgressTournament = { status: 'In Progress' };
        expect(isTeamFinalized(preTeam, inProgressTournament, [])).toBe(true);
        expect(getRerollPurchaseCost(preTeam, true)).toBe(120000);

        // Also finalized if matches have been played
        const playedMatches = [{ teamA: 'team1', teamB: 'team2', status: 'played' }];
        expect(isTeamFinalized(preTeam, recruitingTournament, playedMatches)).toBe(true);
    });

    it('calculates tier-based SPP and TV for player development', () => {
        // 1st advancement (index 0) chosen primary: 6 SPP, +20k TV
        const adv1 = getAdvancementCostAndValue(0, 'chosenPrimary');
        expect(adv1.sppCost).toBe(6);
        expect(adv1.tvIncrease).toBe(20000);
        expect(adv1.advNum).toBe(1);

        // 2nd advancement (index 1) chosen primary: 8 SPP, +20k TV
        const adv2 = getAdvancementCostAndValue(1, 'chosenPrimary');
        expect(adv2.sppCost).toBe(8);
        expect(adv2.tvIncrease).toBe(20000);
        expect(adv2.advNum).toBe(2);

        // 2nd advancement chosen secondary: 12 SPP, +40k TV
        const adv2Sec = getAdvancementCostAndValue(1, 'chosenSecondary');
        expect(adv2Sec.sppCost).toBe(12);
        expect(adv2Sec.tvIncrease).toBe(40000);

        // 3rd advancement stat ST: 20 SPP, +60k TV
        const adv3St = getAdvancementCostAndValue(2, 'characteristic_st');
        expect(adv3St.sppCost).toBe(20);
        expect(adv3St.tvIncrease).toBe(60000);

        // Characteristic AG TV increase check (+30k TV)
        const advAg = getAdvancementCostAndValue(0, 'characteristic_ag');
        expect(advAg.sppCost).toBe(14);
        expect(advAg.tvIncrease).toBe(30000);

        // Level 6 checks
        const adv6 = getAdvancementCostAndValue(5, 'chosenPrimary');
        expect(adv6.sppCost).toBe(30);
        const adv6Char = getAdvancementCostAndValue(5, 'characteristic_st');
        expect(adv6Char.sppCost).toBe(38);
    });

    it('parses currency correctly with various formats', () => {
        expect(parseCurrency('120,000 gold')).toBe(120000);
        expect(parseCurrency(60000)).toBe(60000);
        expect(parseCurrency('')).toBe(0);
        expect(parseCurrency(null)).toBe(0);
    });
});
