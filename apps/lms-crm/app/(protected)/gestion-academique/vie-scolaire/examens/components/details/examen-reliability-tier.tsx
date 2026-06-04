"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider, SliderThumb } from "@/components/ui/slider"
import { Bolt, FolderSymlink, Radar, TrendingUp } from "lucide-react"
import { Separator } from "@/components/ui/separator" 
import { User as Examen } from "@/app/models/user";

const tiers = [
  { name: "Niveau 1", color: "#e879f9", points: 0, nextGoal: 1000 },
  { name: "Niveau 2", color: "#8b5cf6", points: 1000, nextGoal: 2500 },
  { name: "Niveau 3", color: "#3b82f6", points: 2500, nextGoal: 4250 },
  { name: "Gold", color: "#f59e0b", points: 4250, nextGoal: 5000 },
  { name: "VIP", color: "#ef4444", points: 5000, nextGoal: null },
]

const stats = [
  {
    icon: <Bolt className="w-5 h-5 text-secondary-foreground/70" />,
    title: "Points actuels",
    subtitle: "GagnÃ©s via actions",
    getValue: (currentPoints: number) => currentPoints.toLocaleString()
  },
  {
    icon: <Radar className="w-5 h-5 text-secondary-foreground/70" />,
    title: "Objectif suivant",
    subtitle: "Points pour monter de grade",
    getValue: (currentPoints: number, nextGoal?: number | null) => `${currentPoints.toLocaleString()}/${nextGoal?.toLocaleString() || 'Max'}`
  },
  {
    icon: <FolderSymlink className="w-5 h-5 text-secondary-foreground/70" />,
    title: "Croissance",
    subtitle: "Progression mensuelle",
    getValue: (currentPoints: number, nextGoal?: number | null) => {
      const progressPercentage = nextGoal ? Math.round((currentPoints / nextGoal) * 100) : 100;
      return (
        <div className="flex items-center gap-1">
          <Badge variant="success" size="sm" appearance="light">
            <TrendingUp className="w-3 h-3 mr-1" />
            4%  
          </Badge>
          <span className="text-sm font-medium text-foreground">{progressPercentage}%</span>
        </div>
      );
    }
  }
]

export function ExamenReliabilityTier({ Examen }: { Examen: Examen }) {
  const [currentTierIndex, setCurrentTierIndex] = useState(Examen.status === 'ACTIVE' ? 3 : 1)
  const currentTier = tiers[currentTierIndex]
  const currentPoints = currentTier.points
  const nextGoal = currentTier.nextGoal || currentTier.points

  const handleSliderChange = (value: number[]) => {
    setCurrentTierIndex(value[0])
  }

  return (
    <Card className="bg-background rounded-md shadow-none h-full border border-border/60"> 
      <CardContent className="p-0 h-full flex flex-col">
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">Niveau de sÃ©curitÃ© / FiabilitÃ©</h3>
        <div className="flex flex-col justify-between bg-background rounded-md m-1 mt-0 border border-input py-5 px-3.5 h-full">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-md bg-background border border-border size-[36px] shrink-0">
                  <div className="flex items-center justify-center bg-background border border-border rounded-md size-[30px]">
                     <Bolt className="size-5 text-foreground/70" />
                  </div>
                </div>
                <div className="flex items-end gap-1.5">
                  <h3 className="text-2xl font-semibold text-foreground leading-6">{currentTier.name}</h3>
                  <span className="text-xs text-muted-foreground font-normal">Rang {currentTierIndex + 1}</span>
                </div>
              </div> 
              <Button variant="outline" size="sm" className="border-border">
                RÃ©viser
              </Button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Slider
                  value={[currentTierIndex]}
                  onValueChange={handleSliderChange}
                  max={4}
                  min={0}
                  step={1}
                  className="relative w-full h-1.5 flex items-center"
                >
                  <div className="absolute w-full h-1.5 rounded-sm bg-muted/30" />
                  <SliderThumb className="bg-foreground border-foreground"/>
                </Slider>
              </div>

              <div className="flex justify-between text-sm">
                {tiers.map((tier, index) => (
                  <span key={tier.name} className={`${index === currentTierIndex ? "font-medium" : "text-muted-foreground"}`}>
                    {tier.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Card className="flex items-center justify-center rounded-md bg-background border border-border h-[36px] w-[36px] shadow-none shrink-0"> 
                      {stat.icon}
                    </Card>
                    
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground text-2sm">{stat.title}</span>
                      <span className="text-xs text-muted-foreground font-normal">{stat.subtitle}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {index === 0 && stat.getValue(currentPoints)}
                    {index === 1 && stat.getValue(currentPoints, nextGoal)}
                    {index === 2 && stat.getValue(currentPoints, nextGoal)}
                  </div>
                </div>
                {index < stats.length - 1 && <Separator className="my-3.5" />}
              </div>
            ))}
          </div>
        </div> 
      </CardContent>
    </Card>
  )
}

