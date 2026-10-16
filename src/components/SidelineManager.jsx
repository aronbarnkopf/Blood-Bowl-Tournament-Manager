import React, { useState } from 'react';
import { RefreshCcw, UserPlus, Heart, Users, DollarSign, Plus, Minus, Edit2 } from 'lucide-react';
import { isTeamFinalized, getRerollPurchaseCost } from '../utils/bbRules';

const SidelineItem = ({
    icon: Icon,
    label,
    value,
    cost,
    onBuy,
    onRemove,
    onCostChange,
    canBuy,
    canRemove,
    isBinary = false,
    themeColor = "var(--color-primary)",
    finalized = false
}) => {
    const [isEditingCost, setIsEditingCost] = useState(false);
    const [costInput, setCostInput] = useState(cost);

    const handleCostSave = () => {
        onCostChange(costInput);
        setIsEditingCost(false);
    };

    return (
        <div className="sideline-item card">
            <div className="sideline-header">
                <div className="icon-wrapper" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                    <Icon size={20} />
                </div>
                <div className="item-details">
                    <span className="item-label">
                        {label} {finalized && label.includes('Re-rolls') && <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 800 }}>(2x Season Cost)</span>}
                    </span>
                    {isEditingCost && !finalized ? (
                        <div className="cost-edit">
                            <input
                                type="number"
                                step={5000}
                                min={0}
                                value={costInput}
                                onChange={(e) => setCostInput(parseInt(e.target.value) || 0)}
                                className="cost-input"
                                autoFocus
                                onBlur={handleCostSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleCostSave()}
                            />
                        </div>
                    ) : (
                        <div className="item-cost" onClick={finalized ? undefined : () => setIsEditingCost(true)} title={finalized ? "Costs are locked once the team is finalized" : "Click to edit cost"}>
                            <DollarSign size={12} />
                            <span>{parseInt(cost).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="sideline-controls">
                <button
                    className="control-btn remove"
                    onClick={onRemove}
                    disabled={!canRemove || (isBinary && !value)}
                    title={finalized ? "Remove (0 gold refund in active season)" : "Remove (refunded)"}
                >
                    <Minus size={16} />
                </button>
                <div className="value-display">
                    {isBinary ? (value ? 'Yes' : 'No') : value}
                </div>
                <button
                    className="control-btn buy"
                    onClick={onBuy}
                    disabled={!canBuy || (isBinary && value)}
                    title="Buy"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
};

const SidelineManager = ({ team, tournament, matches, treasury, updateSideline }) => {
    const currentTreasury = parseInt(treasury.replace(/\D/g, '')) || 0;
    const finalized = isTeamFinalized(team, tournament, matches);
    const effectiveRerollCost = getRerollPurchaseCost(team, finalized);

    const handleUpdate = (type, change, costOverride) => {
        updateSideline(team.id, type, change, costOverride);
    };

    return (
        <div className="sideline-manager">
            <h3>Sideline Staff & Re-rolls</h3>
            <div className="sideline-grid">
                <SidelineItem
                    icon={RefreshCcw}
                    label="Team Re-rolls"
                    value={team.rerolls || 0}
                    cost={effectiveRerollCost}
                    onBuy={() => handleUpdate('rerolls', 1)}
                    onRemove={() => handleUpdate('rerolls', -1)}
                    onCostChange={(newCost) => handleUpdate('rerolls', 0, newCost)}
                    canBuy={currentTreasury >= effectiveRerollCost}
                    canRemove={(parseInt(team.rerolls) || 0) > 0}
                    themeColor="#6366f1"
                    finalized={finalized}
                />

                <SidelineItem
                    icon={Heart}
                    label="Apothecary"
                    value={team.apothecary}
                    cost={team.apothecaryCost || 50000}
                    onBuy={() => handleUpdate('apothecary', 1)}
                    onRemove={() => handleUpdate('apothecary', -1)}
                    onCostChange={(newCost) => handleUpdate('apothecary', 0, newCost)}
                    canBuy={currentTreasury >= (team.apothecaryCost || 50000)}
                    canRemove={!!team.apothecary}
                    isBinary={true}
                    themeColor="#ec4899"
                    finalized={finalized}
                />

                <SidelineItem
                    icon={Users}
                    label="Cheerleaders"
                    value={team.cheerleaders || 0}
                    cost={team.cheerleaderCost || 10000}
                    onBuy={() => handleUpdate('cheerleaders', 1)}
                    onRemove={() => handleUpdate('cheerleaders', -1)}
                    onCostChange={(newCost) => handleUpdate('cheerleaders', 0, newCost)}
                    canBuy={currentTreasury >= (team.cheerleaderCost || 10000)}
                    canRemove={(parseInt(team.cheerleaders) || 0) > 0}
                    themeColor="#eab308"
                    finalized={finalized}
                />

                <SidelineItem
                    icon={UserPlus}
                    label="Assistant Coaches"
                    value={team.assistantCoaches || 0}
                    cost={team.assistantCoachCost || 10000}
                    onBuy={() => handleUpdate('assistantCoaches', 1)}
                    onRemove={() => handleUpdate('assistantCoaches', -1)}
                    onCostChange={(newCost) => handleUpdate('assistantCoaches', 0, newCost)}
                    canBuy={currentTreasury >= (team.assistantCoachCost || 10000)}
                    canRemove={(parseInt(team.assistantCoaches) || 0) > 0}
                    themeColor="#3b82f6"
                    finalized={finalized}
                />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .sideline-manager {
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid var(--color-border);
                }
                .sideline-manager h3 {
                    font-size: 1.1rem;
                    margin-bottom: 1.5rem;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .sideline-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 1rem;
                }
                .sideline-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--color-border);
                    transition: border-color 0.2s;
                }
                .sideline-item:hover {
                    border-color: var(--color-primary);
                }
                .sideline-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .icon-wrapper {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .item-details {
                    display: flex;
                    flex-direction: column;
                }
                .item-label {
                    font-weight: 600;
                    font-size: 0.9rem;
                    line-height: 1.2;
                }
                .item-cost {
                    display: flex;
                    align-items: center;
                    gap: 0.2rem;
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                    cursor: pointer;
                }
                .item-cost:hover { color: var(--color-primary); }
                
                .cost-input {
                    background: #111;
                    border: 1px solid var(--color-primary);
                    color: white;
                    width: 60px;
                    font-size: 0.75rem;
                    padding: 0.1rem 0.2rem;
                    border-radius: 4px;
                }

                .sideline-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #111;
                    padding: 0.25rem;
                    border-radius: 6px;
                    border: 1px solid var(--color-border);
                }
                .control-btn {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    color: var(--color-text-muted);
                    cursor: pointer;
                    border-radius: 4px;
                }
                .control-btn:hover:not(:disabled) {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .control-btn.buy:hover:not(:disabled) {
                    background: rgba(34, 197, 94, 0.2);
                    color: #22c55e;
                }
                .control-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .value-display {
                    min-width: 24px;
                    text-align: center;
                    font-weight: 700;
                    font-size: 0.9rem;
                }
                `
            }} />
        </div>
    );
};

export default SidelineManager;
