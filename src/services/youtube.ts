'use server';

import { z } from 'zod';

const VideoDetailsSchema = z.object({
  videoId: z.string(),
  title: z.string(),
});
type VideoDetails = z.infer<typeof VideoDetailsSchema>;

export async function getVideoDetails(query: string): Promise<VideoDetails | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key is not configured.");
  }
  query = `${query} recipe tutorial`;

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query
  )}&type=video&maxResults=5&key=${apiKey}`;

  try {
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      console.log("No videos found for query:", query);
      return null;
    }

    // Loop through first 5 videos until a valid one is found
    for (const item of searchData.items) {
      const videoId = item.id.videoId;

      const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=status,snippet,contentDetails&id=${videoId}&key=${apiKey}`;
      const videoDetailsResponse = await fetch(videoDetailsUrl);
      const videoDetailsData = await videoDetailsResponse.json();

      if (videoDetailsData.items && videoDetailsData.items.length > 0) {
        const videoDetails = videoDetailsData.items[0];
        const status = videoDetails.status;

        // ✅ safer embeddable check
        if (
          status?.embeddable === true &&
          status?.privacyStatus === "public" &&
          status?.uploadStatus === "processed"
        ) {
          console.log(`Found valid video: ${videoDetails.snippet.title} (ID: ${videoId})`);
          return {
            videoId: videoId,
            title: videoDetails.snippet.title,
          };
        }
      }
    }

    console.log("No valid (public, embeddable) videos found in the search results.");
    return null;
  } catch (error) {
    console.error("Error fetching video details from YouTube:", error);
    return null;
  }
}