import { useEffect, useState } from 'react';
import { useWatchdogActions, useWatchdogError, useWatchdogEvents, useWatchdogLoading, useWatchdogRules } from '../../stores/useWatchdogStore';
import type { WatchdogAction, WatchdogRule } from '../../types';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import LoadingFallback from '../ui/LoadingFallback';

export default function WatchdogTab() {
  const rules = useWatchdogRules();
  const events = useWatchdogEvents();
  const isLoading = useWatchdogLoading();
  const error = useWatchdogError();
  const { fetchRules, fetchEvents, removeRule, loadPresets, updateRule } = useWatchdogActions();
  
  const [showModal, setShowModal] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState<WatchdogRule[]>([]);
  const [editingRule, setEditingRule] = useState<WatchdogRule | null>(null);

  useEffect(() => {
    fetchRules();
    fetchEvents();
  }, [fetchRules, fetchEvents]);

  const handleToggleRule = async (rule: WatchdogRule) => {
    const updatedRule = { ...rule, enabled: !rule.enabled };
    await updateRule(updatedRule);
  };

  const handleDeleteRule = async (ruleId: string) => {
    await removeRule(ruleId);
  };

  const handleEditRule = (rule: WatchdogRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleLoadPresets = async () => {
    const presetRules = await loadPresets();
    setPresets(presetRules);
    setShowPresets(true);
  };

  const formatAction = (action: WatchdogAction): string => {
    if (typeof action === 'string') {
      return action.toUpperCase();
    }
    if ('setPriority' in action) {
      return `SET PRIORITY(${action.setPriority.level.toUpperCase()})`;
    }
    if ('setAffinity' in action) {
      return `SET AFFINITY(${action.setAffinity.cores.join(',')})`;
    }
    return 'UNKNOWN';
  };

  const formatConditions = (conditions: { metric: string; operator: string; threshold: number }[]): string => {
    return conditions.map(c => `${c.metric} ${c.operator} ${c.threshold}`).join(' AND ');
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ 
          padding: '12px',
          backgroundColor: 'var(--color-danger-100)',
          border: '1px solid var(--color-danger-300)',
          borderRadius: '4px',
          color: 'var(--color-danger-700)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px'
        }}>
          ERROR: {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '11px', 
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color: 'var(--color-text-primary)'
        }}>
          WATCHDOG RULES
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            onClick={handleLoadPresets}
            disabled={isLoading}
          >
            PRESETS
          </Button>
          <Button
            variant="primary"
            onClick={handleAddRule}
            disabled={isLoading}
          >
            + ADD RULE
          </Button>
        </div>
      </div>

      {isLoading && <LoadingFallback />}

      {/* Rules Table */}
      {!isLoading && (
        <>
          {rules.length === 0 ? (
            <EmptyState
              title="NO RULES DEFINED"
              description="Create your first automation rule to start monitoring processes"
              actionText="ADD RULE"
              onAction={handleAddRule}
            />
          ) : (
            <div style={{ 
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px'
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: 'var(--color-surface)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    <th style={{ 
                      padding: '8px 12px', 
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      fontSize: '10px'
                    }}>
                      NAME
                    </th>
                    <th style={{ 
                      padding: '8px 12px', 
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      fontSize: '10px'
                    }}>
                      STATUS
                    </th>
                    <th style={{ 
                      padding: '8px 12px', 
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      fontSize: '10px'
                    }}>
                      CONDITIONS
                    </th>
                    <th style={{ 
                      padding: '8px 12px', 
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      fontSize: '10px'
                    }}>
                      ACTION
                    </th>
                    <th style={{ 
                      padding: '8px 12px', 
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      fontSize: '10px'
                    }}>
                      PROFILE
                    </th>
                    <th style={{ 
                      padding: '8px 12px', 
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      fontSize: '10px'
                    }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule: WatchdogRule) => (
                    <tr 
                      key={rule.id}
                      style={{ 
                        borderBottom: '1px solid var(--color-border)',
                        '&:hover': {
                          backgroundColor: 'var(--color-surface)'
                        }
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ 
                          fontWeight: 'bold',
                          color: 'var(--color-text-primary)'
                        }}>
                          {rule.name}
                        </div>
                        <div style={{ 
                          fontSize: '10px',
                          color: 'var(--color-text-secondary)',
                          marginTop: '2px'
                        }}>
                          ID: {rule.id}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleToggleRule(rule)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: rule.enabled 
                              ? '1px solid var(--color-success-500)'
                              : '1px solid var(--color-text-muted)',
                            backgroundColor: rule.enabled 
                              ? 'var(--color-success-500)'
                              : 'transparent',
                            color: rule.enabled 
                              ? 'white'
                              : 'var(--color-text-secondary)',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {rule.enabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ 
                          color: 'var(--color-text-primary)',
                          fontSize: '11px'
                        }}>
                          {formatConditions(rule.conditions)}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ 
                          color: 'var(--color-accent-500)',
                          fontWeight: 'bold',
                          fontSize: '11px'
                        }}>
                          {formatAction(rule.action)}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ 
                          color: 'var(--color-text-primary)',
                          fontSize: '11px'
                        }}>
                          {rule.profileId || 'GLOBAL'}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                          >
                            EDIT
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            DELETE
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Event Log */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '11px', 
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color: 'var(--color-text-primary)'
        }}>
          EVENT LOG
        </h3>
        
        {events.length === 0 ? (
          <EmptyState
            title="NO EVENTS YET"
            description="Watchdog events will appear here when rules are triggered"
          />
        ) : (
          <div style={{ 
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            overflow: 'hidden',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: 'var(--color-surface)',
                  borderBottom: '1px solid var(--color-border)',
                  position: 'sticky',
                  top: 0
                }}>
                  <th style={{ 
                    padding: '8px 12px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }}>
                    TIME
                  </th>
                  <th style={{ 
                    padding: '8px 12px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }}>
                    RULE
                  </th>
                  <th style={{ 
                    padding: '8px 12px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }}>
                    PROCESS
                  </th>
                  <th style={{ 
                    padding: '8px 12px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }}>
                    ACTION
                  </th>
                  <th style={{ 
                    padding: '8px 12px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }}>
                    RESULT
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((event, index: number) => (
                  <tr 
                    key={index}
                    style={{ 
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: event.success ? 'transparent' : 'var(--color-danger-50)'
                    }}
                  >
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ 
                        color: 'var(--color-text-secondary)',
                        fontSize: '10px'
                      }}>
                        {formatTime(event.timestamp)}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ 
                        color: 'var(--color-text-primary)',
                        fontSize: '11px'
                      }}>
                        {event.ruleName}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ 
                        color: 'var(--color-text-primary)',
                        fontSize: '11px'
                      }}>
                        {event.processName} ({event.pid})
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ 
                        color: 'var(--color-accent-500)',
                        fontWeight: 'bold',
                        fontSize: '11px'
                      }}>
                        {event.actionTaken}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ 
                        color: event.success 
                          ? 'var(--color-success-500)' 
                          : 'var(--color-danger-500)',
                        fontWeight: 'bold',
                        fontSize: '11px'
                      }}>
                        {event.success ? 'SUCCESS' : 'FAILED'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals would be implemented here */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-background)',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '600px',
            maxWidth: '80vw',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>
              {editingRule ? 'EDIT RULE' : 'ADD RULE'}
            </h3>
            <p>Rule modal implementation would go here</p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <Button onClick={() => setShowModal(false)}>
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPresets && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-background)',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '500px',
            maxWidth: '80vw'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>
              PRESET RULES
            </h3>
            {presets.map((preset) => (
              <div key={preset.id} style={{ 
                padding: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                marginBottom: '8px'
              }}>
                <div style={{ fontWeight: 'bold' }}>{preset.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                  {formatConditions(preset.conditions)}
                </div>
              </div>
            ))}
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <Button onClick={() => setShowPresets(false)}>
                CLOSE
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
