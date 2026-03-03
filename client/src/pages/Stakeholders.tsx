import { useState } from 'react';
import { deals, getRoleColor, getSentimentColor } from '@/lib/data';
import { motion } from 'framer-motion';
import { Users, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';

const allStakeholders = deals.flatMap(d =>
  d.stakeholders.map(s => ({ ...s, dealName: d.company, dealId: d.id, dealLogo: d.logo }))
);

export default function Stakeholders() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = allStakeholders.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.dealName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[900px]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">Stakeholders</h1>
          <p className="text-muted-foreground text-sm">All contacts across your pipeline.</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stakeholders..."
            className="pl-10 h-9 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filtered.map(s => (
            <Link key={`${s.dealId}-${s.id}`} href={`/deal/${s.dealId}`}>
              <Card className="bg-card border-border/50 hover:border-border/80 transition-all hover:shadow-md cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={s.avatar}
                      alt={s.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-border/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.title}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getRoleColor(s.role)}`}>
                          {s.role}
                        </Badge>
                        <span className={`text-[9px] font-medium ${getSentimentColor(s.sentiment)}`}>
                          {s.sentiment}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <img
                        src={s.dealLogo}
                        alt=""
                        className="w-6 h-6 rounded bg-white/10 object-contain p-0.5 ml-auto mb-1"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${s.dealName}&background=1a1f36&color=fff&size=24`; }}
                      />
                      <div className="text-[10px] text-muted-foreground">{s.dealName}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
