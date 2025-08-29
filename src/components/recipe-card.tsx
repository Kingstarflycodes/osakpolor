'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Recipe } from '@/lib/types';
import { BookOpen, MapPin, Soup } from 'lucide-react';
import { findNearbyRestaurant } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { FindRestaurantOutput } from '@/ai/flows/find-restaurant';

interface RecipeCardProps {
  recipe: Recipe;
  onRestaurantFound: (details: FindRestaurantOutput) => void;
}

export function RecipeCard({ recipe, onRestaurantFound }: RecipeCardProps) {
  const { toast } = useToast();

  const handleFindRestaurant = async () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Location Error',
        description: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    toast({
      title: 'Finding restaurants near you...',
      description: 'Please wait a moment.',
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await findNearbyRestaurant({
            dishName: recipe.dishName,
            latitude,
            longitude,
          });

          if (result.restaurants && result.restaurants.length > 0) {
            onRestaurantFound(result);
          } else {
            toast({
              variant: 'destructive',
              title: 'No luck!',
              description: 'Could not find any nearby restaurants for this dish.',
            });
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Search Error',
            description: 'Could not find a nearby restaurant.',
          });
        }
      },
      () => {
        toast({
          variant: 'destructive',
          title: 'Location Error',
          description: 'Unable to retrieve your location. Please enable location services.',
        });
      }
    );
  };

  // 🔑 Helper to normalize YouTube input (accepts both IDs and full links)
  const getYouTubeId = (input?: string): string | null => {
    if (!input) return null;

    // Case 1: Full YouTube URL
    const urlPattern =
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = input.match(urlPattern);
    if (match && match[1]) return match[1];

    // Case 2: Already a YouTube video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

    return null;
  };

  const videoKey = getYouTubeId(recipe.videoId);

  return (
    <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">
          {recipe.dishName}
        </CardTitle>
        <CardDescription>{recipe.culturalOrigin}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {videoKey ? (
          <div className="aspect-video w-full rounded-lg overflow-hidden">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoKey}`}
              title={recipe.videoTitle || 'Recipe tutorial'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No video tutorial available for this dish.
          </p>
        )}

        <Accordion
          type="single"
          collapsible
          defaultValue="ingredients"
          className="w-full"
        >
          <AccordionItem value="ingredients">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Soup className="h-5 w-5" /> Ingredients
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-base whitespace-pre-wrap">
                {recipe.ingredients}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="recipe">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Recipe
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-base whitespace-pre-wrap">
                {recipe.recipe}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button onClick={handleFindRestaurant} className="w-full">
          <MapPin className="mr-2 h-5 w-5" />
          Find Restaurants
        </Button>
      </CardFooter>
    </Card>
  );
}