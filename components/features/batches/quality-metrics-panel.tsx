'use client'

/**
 * Quality Metrics Panel Component
 * Display quality metrics for cannabis and produce batches
 * Adapted from prototype with shadcn/ui components
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { DomainBatch } from '@/types/batch'

interface QualityMetricsPanelProps {
  batch: DomainBatch
}

export function QualityMetricsPanel({ batch }: QualityMetricsPanelProps) {
  // Cannabis-specific metrics
  if (batch.domain_type === 'cannabis' && 'thc_content' in batch) {
    const thcValue = batch.thc_content || 0
    const cbdValue = batch.cbd_content || 0

    return (
      <Card>
        <CardHeader>
          <CardTitle>Quality Metrics</CardTitle>
          <CardDescription>Cannabinoid content and quality indicators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* THC Content */}
          {thcValue > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">THC Content</span>
                <span className="text-sm font-bold">{thcValue}%</span>
              </div>
              <Progress value={Math.min((thcValue / 30) * 100, 100)} />
              <p className="text-xs text-muted-foreground mt-1">
                {thcValue < 15
                  ? 'Low potency'
                  : thcValue < 20
                  ? 'Medium potency'
                  : thcValue < 25
                  ? 'High potency'
                  : 'Very high potency'}
              </p>
            </div>
          )}

          {/* CBD Content */}
          {cbdValue > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CBD Content</span>
                <span className="text-sm font-bold">{cbdValue}%</span>
              </div>
              <Progress value={Math.min((cbdValue / 20) * 100, 100)} className="bg-green-100" />
              <p className="text-xs text-muted-foreground mt-1">
                {cbdValue < 5
                  ? 'Low CBD'
                  : cbdValue < 10
                  ? 'Medium CBD'
                  : cbdValue < 15
                  ? 'High CBD'
                  : 'Very high CBD'}
              </p>
            </div>
          )}

          {/* Terpene Profile */}
          {batch.terpene_profile && (
            <div>
              <span className="text-sm font-medium">Terpene Profile</span>
              <p className="text-sm text-muted-foreground mt-1">{batch.terpene_profile}</p>
            </div>
          )}

          {/* Placeholder for additional metrics */}
          {!thcValue && !cbdValue && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No quality metrics recorded yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Metrics will appear after lab testing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Produce-specific metrics
  if (batch.domain_type === 'produce' && 'grade' in batch) {
    const brixValue = batch.brix_level || 0
    const defectRate = batch.defect_rate || 0

    return (
      <Card>
        <CardHeader>
          <CardTitle>Quality Metrics</CardTitle>
          <CardDescription>Quality indicators and measurements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grade */}
          {batch.grade && (
            <div>
              <span className="text-sm font-medium">Quality Grade</span>
              <div className="mt-2">
                <Badge
                  variant={batch.grade === 'A' ? 'default' : 'secondary'}
                  className="text-lg px-4 py-1"
                >
                  Grade {batch.grade}
                </Badge>
              </div>
            </div>
          )}

          {/* Ripeness */}
          {batch.ripeness && (
            <div>
              <span className="text-sm font-medium">Ripeness</span>
              <p className="text-sm text-muted-foreground mt-1 capitalize">{batch.ripeness}</p>
            </div>
          )}

          {/* Brix Level (Sugar Content) */}
          {brixValue > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Brix Level (Sugar Content)</span>
                <span className="text-sm font-bold">{brixValue}°Bx</span>
              </div>
              <Progress value={Math.min((brixValue / 20) * 100, 100)} />
              <p className="text-xs text-muted-foreground mt-1">
                {brixValue < 8 ? 'Low sweetness' : brixValue < 12 ? 'Good sweetness' : 'Excellent sweetness'}
              </p>
            </div>
          )}

          {/* Firmness */}
          {batch.firmness && (
            <div>
              <span className="text-sm font-medium">Firmness</span>
              <p className="text-sm text-muted-foreground mt-1 capitalize">{batch.firmness}</p>
            </div>
          )}

          {/* Color */}
          {batch.color && (
            <div>
              <span className="text-sm font-medium">Color</span>
              <p className="text-sm text-muted-foreground mt-1 capitalize">{batch.color}</p>
            </div>
          )}

          {/* Defect Rate */}
          {defectRate !== null && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Defect Rate</span>
                <span className="text-sm font-bold">{defectRate}%</span>
              </div>
              <Progress 
                value={defectRate} 
                className={defectRate > 5 ? 'bg-red-100' : 'bg-green-100'} 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {defectRate < 2
                  ? 'Excellent quality'
                  : defectRate < 5
                  ? 'Good quality'
                  : defectRate < 10
                  ? 'Acceptable quality'
                  : 'High defect rate'}
              </p>
            </div>
          )}

          {/* Certifications */}
          <div>
            <span className="text-sm font-medium">Certifications</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {batch.certifications && typeof batch.certifications === 'object' ? (
                Object.entries(batch.certifications as Record<string, boolean>).map(
                  ([cert, value]) =>
                    value && (
                      <Badge key={cert} variant="outline">
                        {cert.toUpperCase()}
                      </Badge>
                    )
                )
              ) : (
                <p className="text-xs text-muted-foreground">No certifications</p>
              )}
            </div>
          </div>

          {/* Placeholder for no metrics */}
          {!batch.grade && !brixValue && !batch.firmness && !batch.color && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No quality metrics recorded yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Metrics will appear after grading and testing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Fallback for no metrics
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-8">
          No quality metrics available for this batch.
        </p>
      </CardContent>
    </Card>
  )
}
