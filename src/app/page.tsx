'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import {
  ChefHat,
  Paperclip,
  Send,
  User,
  LoaderCircle,
  X,
  Volume2,
  MapPin,
  Car,
  PersonStanding,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { processUserMessage, getSpeech } from '@/app/actions';
import { RecipeCard } from '@/components/recipe-card';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/lib/types';
import type { FindRestaurantOutput } from '@/ai/flows/find-restaurant';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: ReactNode;
  textContent?: string;
}

const formSchema = z.object({
  message: z.string(),
  image: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// --- helper for video links ---
const extractYouTubeId = (url?: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2];
    }
  } catch {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
  return null;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        "Ah, my friend! Welcome to my kitchen. Ask me for any Nigerian recipe or show me a picture of a dish. I dey for you!",
      textContent:
        "Ah, my friend! Welcome to my kitchen. Ask me for any Nigerian recipe or show me a picture of a dish. I dey for you!",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: '' },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePlayAudio = async (text: string) => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      if (activeAudio.src.startsWith('data:audio')) {
        setActiveAudio(null);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const { audioDataUri } = await getSpeech({ text });
      const audio = new Audio(audioDataUri);
      setActiveAudio(audio);
      audio.play();
      audio.onended = () => setActiveAudio(null);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Speech Error',
        description: 'Could not generate audio for this message.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    scrollAreaRef.current?.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (activeAudio) activeAudio.pause();
    };
  }, [activeAudio]);

  const onRestaurantFound = (details: FindRestaurantOutput) => {
    const restaurantMessageContent = (
      <div className="flex flex-col gap-4">
        <p className="font-bold">I found some places for you! Here are the closest ones:</p>
        <div className="space-y-4">
          {details.restaurants.map((r, i) => (
            <div key={i} className="space-y-2">
              <h3 className="font-semibold text-primary">{r.restaurantName}</h3>
              <p className="text-sm text-muted-foreground">{r.address}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <Car className="h-4 w-4" /> {r.driveTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <PersonStanding className="h-4 w-4" /> {r.walkTime}
                </span>
              </div>
              <Button
                asChild
                variant="link"
                className="p-0 h-auto justify-start text-base text-primary-foreground hover:text-primary-foreground/80"
              >
                <Link href={r.mapsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="mr-2 h-4 w-4" />
                  View on Google Maps
                </Link>
              </Button>
              {i < details.restaurants.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </div>
    );

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: restaurantMessageContent,
        textContent: `I found these restaurants for you: ${details.restaurants
          .map((r) => r.restaurantName)
          .join(', ')}`,
      },
    ]);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const { message } = data;
    if (!message && !imagePreview) return;

    let userMessageContent: ReactNode = message;
    if (imagePreview) {
      userMessageContent = (
        <div className="flex flex-col gap-2">
          <Image
            src={imagePreview}
            alt="User upload"
            width={200}
            height={200}
            className="rounded-lg object-cover"
          />
          {message && <p>{message}</p>}
        </div>
      );
    }

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: userMessageContent },
    ]);

    setIsProcessing(true);
    const imageDataUriForSubmission = imagePreview;

    reset();
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const result = await processUserMessage({
        textQuery: message || null,
        imageDataUri: imageDataUriForSubmission,
      });

      if (result.type === 'error') throw new Error(result.message);

      // 🔑 Fix: inject videoId for RecipeCard
      if (result.type === 'recipe') {
        const recipe = result.data as Recipe;
        (recipe as any).videoId = extractYouTubeId(recipe.videoTutorialLink || undefined);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            result.type === 'recipe' ? (
              <RecipeCard recipe={result.data as Recipe} onRestaurantFound={onRestaurantFound} />
            ) : (
              <div className="whitespace-pre-wrap">{result.data.response}</div>
            ),
          textContent:
            result.type === 'recipe'
              ? `Here is the recipe for ${result.data.dishName}`
              : result.data.response,
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Oh, sorry about that!',
        description: errorMessage,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'My friend, something went wrong in the kitchen. Please try again.',
          textContent: 'My friend, something went wrong in the kitchen. Please try again.',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setValue('image', null);
  };

  const registeredImageField = register('image', { onChange: handleFileChange });

  return (
    <div className="flex h-screen w-full flex-col bg-background font-body">
      <header className="flex items-center justify-between border-b p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground font-headline">
            Osakpolor, the Naija Chef
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="container mx-auto max-w-4xl p-4 space-y-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-4',
                  message.role === 'user' && 'justify-end'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-10 w-10 border-2 border-primary shrink-0">
                    <AvatarFallback>
                      <ChefHat className="text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xl rounded-lg p-4 relative group',
                    message.role === 'assistant'
                      ? 'bg-card text-card-foreground'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  <div className="text-base prose prose-sm dark:prose-invert max-w-none prose-p:m-0">
                    {message.content}
                  </div>
                  {message.role === 'assistant' && message.textContent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handlePlayAudio(message.textContent as string)}
                      disabled={isProcessing}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-10 w-10 border-2 border-muted shrink-0">
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarFallback>
                    <ChefHat className="text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-xl rounded-lg p-4 bg-card">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LoaderCircle className="animate-spin h-5 w-5" />
                    <span>Osakpolor is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      <footer className="border-t bg-background p-4">
        <Card className="container mx-auto max-w-4xl p-2 rounded-xl">
          {imagePreview && (
            <div className="relative mb-2 w-fit">
              <Image
                src={imagePreview}
                alt="Image preview"
                width={80}
                height={80}
                className="rounded-md object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                onClick={clearImagePreview}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              {...registeredImageField}
              ref={(el) => {
                registeredImageField.ref(el);
                fileInputRef.current = el;
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Input
                {...register('message')}
                placeholder="Ask for a recipe or describe a dish..."
                autoComplete="off"
                disabled={isProcessing}
                className="pr-12"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                disabled={isProcessing || (!watch('message') && !imagePreview)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </footer>
    </div>
  );
}