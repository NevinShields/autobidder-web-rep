import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, X, ExternalLink, Calendar } from 'lucide-react';
import { Link } from 'wouter';

interface MigrationNoticeProps {
  variant?: 'banner' | 'card';
  dismissible?: boolean;
  showDetails?: boolean;
}

export default function MigrationNotice({ 
  variant = 'card', 
  dismissible = true, 
  showDetails = true 
}: MigrationNoticeProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('migration-notice-dismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('migration-notice-dismissed', 'true');
  };

  if (isDismissed && dismissible) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Maps Drawing Update:</span> We've upgraded our measurement tool to use Terra Draw, 
                replacing Google's deprecated Drawing Library. 
                <Link href="/map-migration-demo" className="font-medium underline hover:text-yellow-900 ml-1">
                  See the improvements →
                </Link>
              </p>
            </div>
          </div>
          {dismissible && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-yellow-800 hover:text-yellow-900 hover:bg-yellow-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-yellow-800">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Map Drawing System Upgrade
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
              Completed
            </Badge>
          </CardTitle>
          {dismissible && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-yellow-700 hover:text-yellow-800"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="text-sm text-yellow-800">
            <p className="mb-3">
              <strong>What changed:</strong> We've proactively upgraded our measurement tool from Google's deprecated 
              Drawing Library to Terra Draw - a modern, more capable drawing system.
            </p>
            
            {showDetails && (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-900">Timeline</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Aug 2025: Google begins phase-out
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        May 2026: Complete removal
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                        Today: Migration complete!
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-900">Improvements</h4>
                    <ul className="text-xs space-y-1">
                      <li>• Better editing capabilities</li>
                      <li>• More reliable performance</li>
                      <li>• Future-proof technology</li>
                      <li>• Same measurement accuracy</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href="/map-migration-demo">
                    <Button size="sm" variant="outline" className="text-yellow-800 border-yellow-300 hover:bg-yellow-100">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Demo
                    </Button>
                  </Link>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100"
                    onClick={() => {
                      // Clear dismissal to show notice again
                      localStorage.removeItem('migration-notice-dismissed');
                      setIsDismissed(false);
                    }}
                  >
                    Show again later
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}