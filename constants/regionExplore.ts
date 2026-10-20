import type { ImageSource } from 'expo-image';

export type RegionExploreSite = {
  id: string;
  name: string;
  image: string;
  description: string;
  latitude?: number;
  longitude?: number;
  /** False when coordinates were not provided for this place. */
  hasLocation?: boolean;
};

export type RegionExploreCategory = {
  id: string;
  number: number;
  title: string;
  description: string;
  /** Local slider frames for the “Choose a topic” hero. */
  sliderImages: ImageSource[];
};

/** Explore topic chrome only — place lists come from the portal API. */
export const REGION_EXPLORE_CATEGORIES: RegionExploreCategory[] = [
  {
    id: 'geography',
    number: 1,
    title: 'Physical Geography & Natural Landscapes',
    description:
      'Discover dunes, canyons, coastlines, rivers, and protected landscapes that shape this region’s natural character.',
    sliderImages: [
      require('../assets/sliders/physics1.jpg'),
      require('../assets/sliders/physics2.jpg'),
      require('../assets/sliders/physics3.jpg'),
      require('../assets/sliders/physics4.jpg'),
    ],
  },
  {
    id: 'culture',
    number: 2,
    title: 'Culture',
    description:
      'Meet living traditions, languages, craft, and community experiences that define everyday life across the region.',
    sliderImages: [
      require('../assets/sliders/culture1.jpg'),
      require('../assets/sliders/culture2.jpg'),
      require('../assets/sliders/culture3.jpg'),
      require('../assets/sliders/culture4.jpg'),
    ],
  },
  {
    id: 'history-sites',
    number: 3,
    title: 'Historical Sites',
    description:
      'Walk through heritage landmarks, museums, rock art, and places that tell Namibia’s layered story.',
    sliderImages: [
      require('../assets/sliders/history1.jpg'),
      require('../assets/sliders/history2.jpg'),
      require('../assets/sliders/history3.jpg'),
      require('../assets/sliders/history4.jpg'),
    ],
  },
  {
    id: 'events',
    number: 4,
    title: 'Events & Festivals',
    description:
      'Find seasonal gatherings, cultural festivals, and special occasions worth planning your visit around.',
    sliderImages: [
      require('../assets/sliders/events1.jpg'),
      require('../assets/sliders/events2.jpg'),
      require('../assets/sliders/events3.jpg'),
      require('../assets/sliders/events4.jpg'),
    ],
  },
  {
    id: 'gastronomy',
    number: 5,
    title: 'Food',
    description:
      'Taste local dishes, markets, and dining spots that celebrate regional flavours and food traditions.',
    sliderImages: [
      require('../assets/sliders/gastronomy1.jpg'),
      require('../assets/sliders/gastronomy2.jpg'),
      require('../assets/sliders/gastronomy3.jpg'),
      require('../assets/sliders/gastronomy4.jpg'),
    ],
  },
];
