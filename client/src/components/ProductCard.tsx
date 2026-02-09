import { Product, Group } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, ShoppingBag } from "lucide-react";
import { useGroups } from "@/hooks/use-groups";
import { useState } from "react";
import { JoinGroupDialog } from "./JoinGroupDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  
  // Fetch OPEN groups for this product to determine button state
  const { data: groups, isLoading } = useGroups({ 
    productId: product.id, 
    status: 'aberto' 
  });

  // Find the best group to join (closest to completion or first available)
  const availableGroup = groups?.sort((a, b) => b.currentPeople - a.currentPeople)[0];
  const hasOpenGroup = !!availableGroup;
  
  // Calculate savings
  const savings = Math.round(
    ((Number(product.originalPrice) - Number(product.groupPrice)) / Number(product.originalPrice)) * 100
  );

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="group relative bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden"
      >
        {/* Discount Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-1 text-xs shadow-md">
            -{savings}% OFF
          </Badge>
        </div>

        {/* Image Container */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 relative">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="mb-1">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {product.category}
            </span>
          </div>
          
          <h3 className="font-display font-semibold text-lg leading-tight mb-2 line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>

          {/* Pricing */}
          <div className="mt-auto space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground line-through decoration-red-400">
                R$ {Number(product.originalPrice).toFixed(2)}
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-primary tracking-tight">
                  R$ {Number(product.groupPrice).toFixed(2)}
                </span>
                <span className="text-[10px] text-primary/80 font-medium">
                  Preço em grupo
                </span>
              </div>
            </div>

            {/* Group Status */}
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ) : (
              <div className="space-y-3">
                {hasOpenGroup ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1 text-orange-600">
                        <Users className="w-3 h-3" /> 
                        Grupo aberto!
                      </span>
                      <span>
                        Faltam {product.minPeople - availableGroup.currentPeople}
                      </span>
                    </div>
                    <Progress 
                      value={(availableGroup.currentPeople / product.minPeople) * 100} 
                      className="h-2 bg-orange-100" 
                      indicatorClassName="bg-orange-500"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Seja o primeiro a criar um grupo</span>
                  </div>
                )}

                <Button 
                  onClick={() => setIsJoinDialogOpen(true)}
                  className={`w-full font-bold shadow-md hover:shadow-lg transition-all ${
                    hasOpenGroup 
                      ? "bg-primary hover:bg-orange-600 text-white" 
                      : "bg-white border-2 border-primary text-primary hover:bg-orange-50"
                  }`}
                  size="lg"
                >
                  {hasOpenGroup ? (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Participar Agora
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Criar Grupo
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <JoinGroupDialog 
        isOpen={isJoinDialogOpen}
        onClose={() => setIsJoinDialogOpen(false)}
        product={product}
        existingGroup={availableGroup}
      />
    </>
  );
}
