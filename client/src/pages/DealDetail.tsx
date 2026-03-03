import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { deals, formatCurrency, getConfidenceColor, getConfidenceBg, getRoleColor, getSentimentColor, formatDate, getStageColor } from '@/lib/data';
import type { Stakeholder } from '@/lib/data';
import StakeholderMap from '@/components/StakeholderMap';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Clock, TrendingUp, TrendingDown, AlertTriangle,
  ChevronRight, User, MessageSquare, FileText, Map, BarChart3, X, ExternalLink,
  Mic
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DealDetail() {
  const [, params] = useRoute('/deal/:id');
  const deal = deals.find(d => d.id === params?.id);
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [showSummary, setShowSummary] = useState(true);

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold mb-2">Deal not found</h2>
          <Link href="/">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestSnapshot = deal.snapshots[0];
  const statusLabel = deal.confidenceScore >= 75 ? 'On Track' : deal.confidenceScore >= 50 ? 'Need Attention' : 'At Risk';
  const statusColor = deal.confidenceScore >= 75 ? 'text-status-success' : deal.confidenceScore >= 50 ? 'text-status-warning' : 'text-status-danger';

  return (
    <div className="h-full flex flex-col">
      {/* Deal header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm px-6 py-3.5 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <img
            src={deal.logo}
            alt={deal.company}
            className="w-9 h-9 rounded-lg bg-white/10 object-contain p-1.5 border border-border/30"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${deal.company}&background=1a1f36&color=fff&size=64`; }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-lg font-bold">{deal.company}</h1>
              <a
                href={`https://${deal.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                {deal.website} <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] text-muted-foreground">last edited 13 mins ago</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className={`text-[10px] ${getStageColor(deal.stage)}`}>{deal.stage}</Badge>
              <span className="font-mono text-sm font-medium">{formatCurrency(deal.value)} ACV</span>
              <div className="flex items-center gap-1">
                <span className={`font-mono text-sm font-medium ${getConfidenceColor(deal.confidenceScore)}`}>
                  {deal.confidenceScore}%
                </span>
                {latestSnapshot && latestSnapshot.confidenceChange !== 0 && (
                  <span className={`flex items-center text-xs font-mono ${
                    latestSnapshot.confidenceChange > 0 ? 'text-status-success' : 'text-status-danger'
                  }`}>
                    {latestSnapshot.confidenceChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {latestSnapshot.confidenceChange > 0 ? '+' : ''}{latestSnapshot.confidenceChange}
                  </span>
                )}
              </div>
              <Progress value={deal.confidenceScore} className="w-24 h-1.5" />
            </div>
          </div>
          <Button
            onClick={() => toast('Update Account History coming soon')}
            className="font-display text-xs shrink-0"
          >
            Update Account History
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-border/30 px-6">
              <TabsList className="bg-transparent h-10 gap-1 p-0">
                <TabsTrigger value="map" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-lg text-xs font-display gap-1.5 px-3 h-8">
                  <Map className="w-3.5 h-3.5" />
                  Buying Committee
                </TabsTrigger>
                <TabsTrigger value="signals" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-lg text-xs font-display gap-1.5 px-3 h-8">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Account Signals
                </TabsTrigger>
                <TabsTrigger value="discussions" className="data-[state=active]:bg-muted/50 data-[state=active]:shadow-none rounded-lg text-xs font-display gap-1.5 px-3 h-8">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Internal Discussions
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="map" className="flex-1 m-0 relative">
              <div className="absolute inset-0 flex">
                {/* Stakeholder Map takes full space */}
                <div className="flex-1 relative">
                  <StakeholderMap
                    deal={deal}
                    onStakeholderClick={(s) => setSelectedStakeholder(s)}
                  />

                  {/* Deal Summary — collapsible floating panel, positioned bottom-left above legend */}
                  <AnimatePresence>
                    {showSummary && latestSnapshot && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-4 left-4 z-30 w-60"
                      >
                        <Card className="bg-card/95 backdrop-blur-md border-status-warning/25 shadow-lg shadow-black/20">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-display font-semibold">Deal Summary</span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[10px] font-medium">{formatCurrency(deal.value)} ACV</span>
                                <button
                                  onClick={() => setShowSummary(false)}
                                  className="w-4 h-4 rounded flex items-center justify-center hover:bg-muted/50 transition-colors ml-1"
                                >
                                  <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-0.5 text-[10px]">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Stage:</span>
                                <span>{deal.stage}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Confidence:</span>
                                <span className={getConfidenceColor(deal.confidenceScore)}>
                                  {deal.confidenceScore}%
                                  {latestSnapshot.confidenceChange !== 0 && (
                                    <span className="text-muted-foreground ml-1">
                                      ({latestSnapshot.confidenceChange > 0 ? '+' : ''}{latestSnapshot.confidenceChange})
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="border-t border-border/30 my-2" />

                            <div className="space-y-1.5">
                              <div>
                                <div className="text-[9px] font-semibold text-status-info uppercase tracking-wider mb-0.5">What's Happening</div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">{latestSnapshot.whatsHappening}</p>
                              </div>
                              {latestSnapshot.keyRisks.length > 0 && (
                                <div>
                                  <div className="text-[9px] font-semibold text-status-danger uppercase tracking-wider mb-0.5">Key Risks</div>
                                  {latestSnapshot.keyRisks.slice(0, 3).map((risk, i) => (
                                    <div key={i} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                                      <span className="text-status-danger mt-px shrink-0">•</span>
                                      <span className="line-clamp-1">{risk}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div>
                                <div className="text-[9px] font-semibold text-status-success uppercase tracking-wider mb-0.5">What's Next</div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{latestSnapshot.whatsNext}</p>
                              </div>
                            </div>

                            <div className="border-t border-border/30 mt-2 pt-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="text-[10px] h-6 px-2 flex-1 font-display"
                                onClick={() => toast('Deal map view coming soon')}
                              >
                                View Deal Map
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-6 px-2 flex-1 font-display"
                                onClick={() => setActiveTab('discussions')}
                              >
                                View All Interactions
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Toggle summary button when collapsed */}
                  {!showSummary && (
                    <button
                      onClick={() => setShowSummary(true)}
                      className="absolute top-4 left-4 z-30 w-8 h-8 rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-muted transition-colors shadow-md"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />
                    </button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signals" className="flex-1 m-0 overflow-auto">
              <div className="p-6 max-w-3xl space-y-4">
                <h3 className="font-display text-sm font-semibold mb-4">Account Signals & Intelligence</h3>
                {deal.companyInfo && (
                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4">
                      <h4 className="text-xs font-display font-semibold mb-2">Company Overview</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{deal.companyInfo}</p>
                    </CardContent>
                  </Card>
                )}
                {deal.snapshots.map(snap => (
                  <Card key={snap.id} className="bg-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{snap.interactionType}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(snap.date)}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${getConfidenceBg(snap.confidenceScore)}`}>
                          {snap.confidenceScore}%
                          {snap.confidenceChange !== 0 && (
                            <span className="ml-1">
                              ({snap.confidenceChange > 0 ? '+' : ''}{snap.confidenceChange})
                            </span>
                          )}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium text-status-info">Happening: </span>
                          <span className="text-muted-foreground">{snap.whatsHappening}</span>
                        </div>
                        <div>
                          <span className="font-medium text-status-success">Next: </span>
                          <span className="text-muted-foreground">{snap.whatsNext}</span>
                        </div>
                        {snap.keyRisks.length > 0 && (
                          <div>
                            <span className="font-medium text-status-danger">Risks: </span>
                            <span className="text-muted-foreground">{snap.keyRisks.join('; ')}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="discussions" className="flex-1 m-0 overflow-auto">
              <div className="p-6 max-w-3xl space-y-3">
                <h3 className="font-display text-sm font-semibold mb-4">Meeting History</h3>
                {deal.interactions.map(interaction => (
                  <Card key={interaction.id} className="bg-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{interaction.type}</Badge>
                          <span className="text-xs font-medium">{interaction.keyParticipant}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{interaction.duration}min</span>
                          <span>{formatDate(interaction.date)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{interaction.summary}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Stakeholder detail panel */}
        <AnimatePresence>
          {selectedStakeholder && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-l border-border/50 bg-card/50 shrink-0 overflow-hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-sm font-semibold">Stakeholder Profile</h3>
                    <button
                      onClick={() => setSelectedStakeholder(null)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={selectedStakeholder.avatar}
                      alt={selectedStakeholder.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-border"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{selectedStakeholder.name}</div>
                      <div className="text-xs text-muted-foreground">{selectedStakeholder.title}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className={`text-[10px] ${getRoleColor(selectedStakeholder.role)}`}>
                        {selectedStakeholder.role}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${
                        selectedStakeholder.sentiment === 'Positive' ? 'bg-status-success/10 text-status-success border-status-success/30' :
                        selectedStakeholder.sentiment === 'Neutral' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
                        'bg-status-danger/10 text-status-danger border-status-danger/30'
                      }`}>
                        {selectedStakeholder.sentiment}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedStakeholder.engagement} Engagement
                      </Badge>
                    </div>

                    {selectedStakeholder.keyInsights && (
                      <div>
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Key Insights</div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{selectedStakeholder.keyInsights}</p>
                      </div>
                    )}

                    {selectedStakeholder.email && (
                      <div>
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Contact</div>
                        <p className="text-xs text-primary">{selectedStakeholder.email}</p>
                      </div>
                    )}

                    <div className="border-t border-border/30 pt-3">
                      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Related Interactions</div>
                      {deal.interactions
                        .filter(i => i.keyParticipant === selectedStakeholder.name)
                        .map(interaction => (
                          <div key={interaction.id} className="p-2 rounded bg-muted/20 mb-1.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge variant="outline" className="text-[9px] px-1 py-0">{interaction.type}</Badge>
                              <span className="text-[10px] text-muted-foreground">{formatDate(interaction.date)}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{interaction.summary}</p>
                          </div>
                        ))
                      }
                      {deal.interactions.filter(i => i.keyParticipant === selectedStakeholder.name).length === 0 && (
                        <p className="text-[10px] text-muted-foreground/60 italic">No direct interactions recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ask Meridian bar */}
      <div className="border-t border-border/50 bg-card/50 px-6 py-2.5 shrink-0">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Ask Meridian..."
              className="w-full h-9 px-4 rounded-lg bg-muted/30 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') toast('AI assistant coming soon — this feature requires backend integration.');
              }}
            />
          </div>
          <button
            onClick={() => toast('File upload coming soon')}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast('Voice input coming soon')}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
