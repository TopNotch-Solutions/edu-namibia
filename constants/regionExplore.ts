export type RegionExploreSite = {
  id: string;
  name: string;
  image: string;
  description: string;
  latitude: number;
  longitude: number;
};

export type RegionExploreSubtopic = {
  title: string;
  description: string;
  sites: RegionExploreSite[];
};

export type RegionExploreCategory = {
  id: string;
  number: number;
  title: string;
  image: string;
  subtopics: RegionExploreSubtopic[];
};

/** Shared explore topics shown for every Namibian region. */
export const REGION_EXPLORE_CATEGORIES: RegionExploreCategory[] = [
  {
    id: 'geography',
    number: 1,
    title: 'Physical Geography & Natural Landscapes',
    image:
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1200&q=80',
    subtopics: [
      {
        title: 'Topography & Terrain',
        description:
          'Mountain ranges, plains, valleys, deserts, and coastlines.',
        sites: [
          {
            id: 'geo-topo-1',
            name: 'Sossusvlei Dunes',
            image:
              'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1200&q=80',
            description:
              'Towering red sand dunes in the Namib Desert, including Big Daddy and Deadvlei. One of Namibia’s most iconic desert landscapes.',
            latitude: -24.7275,
            longitude: 15.2925,
          },
          {
            id: 'geo-topo-2',
            name: 'Fish River Canyon',
            image:
              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
            description:
              'Africa’s largest canyon — dramatic cliffs, hiking trails, and sweeping views of the Fish River below.',
            latitude: -27.58,
            longitude: 17.59,
          },
          {
            id: 'geo-topo-3',
            name: 'Spitzkoppe',
            image:
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
            description:
              'Granite peaks rising from the desert floor, popular for climbing, camping, and dramatic sunrise silhouettes.',
            latitude: -21.8244,
            longitude: 15.1906,
          },
        ],
      },
      {
        title: 'Hydrography',
        description:
          'Major rivers, lakes, waterfalls, fjords, and surrounding oceans or seas.',
        sites: [
          {
            id: 'geo-hydro-1',
            name: 'Epupa Falls',
            image:
              'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
            description:
              'Cascades on the Kunene River along the Angola–Namibia border, framed by baobabs and Himba communities.',
            latitude: -17.0014,
            longitude: 13.245,
          },
          {
            id: 'geo-hydro-2',
            name: 'Orange River Mouth',
            image:
              'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1200&q=80',
            description:
              'Where the Orange River meets the Atlantic — wetlands, birdlife, and a key southern hydrographic boundary.',
            latitude: -28.6333,
            longitude: 16.45,
          },
          {
            id: 'geo-hydro-3',
            name: 'Hardap Dam',
            image:
              'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
            description:
              'Namibia’s largest dam near Mariental — fishing, water sports, and a vital water-storage landmark.',
            latitude: -24.49,
            longitude: 17.86,
          },
        ],
      },
      {
        title: 'Protected Areas',
        description:
          'National parks, nature reserves, marine sanctuaries, and biosphere reserves.',
        sites: [
          {
            id: 'geo-protected-1',
            name: 'Etosha National Park',
            image:
              'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80',
            description:
              'One of Africa’s great wildlife parks, centred on the Etosha pan with elephants, lions, rhinos, and busy waterholes.',
            latitude: -18.8555,
            longitude: 16.3292,
          },
          {
            id: 'geo-protected-2',
            name: 'Namib-Naukluft Park',
            image:
              'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1200&q=80',
            description:
              'A vast protected desert landscape covering dunes, mountains, and gravel plains in western Namibia.',
            latitude: -24.15,
            longitude: 15.85,
          },
          {
            id: 'geo-protected-3',
            name: 'Bwabwata National Park',
            image:
              'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
            description:
              'A wildlife corridor in the Zambezi Region linking rivers, floodplains, and community conservancies.',
            latitude: -17.95,
            longitude: 22.5,
          },
        ],
      },
      {
        title: 'Climate & Regions',
        description:
          'Climate zones, seasonal weather patterns, rainfall distribution, and peak nature seasons.',
        sites: [
          {
            id: 'geo-climate-1',
            name: 'Skeleton Coast',
            image:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
            description:
              'Fog-cooled Atlantic coast where desert meets ocean — shipwrecks, seals, and extreme climate contrasts.',
            latitude: -19.3333,
            longitude: 12.7167,
          },
          {
            id: 'geo-climate-2',
            name: 'Caprivi Floodplains',
            image:
              'https://images.unsplash.com/photo-1465146633011-14bb9e0b0f1b?auto=format&fit=crop&w=1200&q=80',
            description:
              'Lush seasonal wetlands in northeastern Namibia with higher rainfall and distinct wet-season ecosystems.',
            latitude: -17.5,
            longitude: 24.2,
          },
          {
            id: 'geo-climate-3',
            name: 'Kalahari Edge near Gobabis',
            image:
              'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=80',
            description:
              'Semi-arid Kalahari landscapes showing Namibia’s inland climate zones, thornveld, and seasonal grazing plains.',
            latitude: -22.45,
            longitude: 18.97,
          },
        ],
      },
    ],
  },
  {
    id: 'culture',
    number: 2,
    title: 'Culture, Society & Heritage',
    image:
      'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1200&q=80',
    subtopics: [
      {
        title: 'History & Heritage',
        description:
          'UNESCO World Heritage sites, historical monuments, ancient ruins, and museum collections.',
        sites: [
          {
            id: 'cul-history-1',
            name: 'Independence Memorial Museum',
            image:
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
            description:
              'A landmark museum in Windhoek telling Namibia’s path to independence and national identity.',
            latitude: -22.5694,
            longitude: 17.0861,
          },
          {
            id: 'cul-history-2',
            name: 'Alte Feste',
            image:
              'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
            description:
              'Historic fort in Windhoek linked to colonial-era history and early settlement of the capital.',
            latitude: -22.5698,
            longitude: 17.0875,
          },
          {
            id: 'cul-history-3',
            name: 'Shark Island, Lüderitz',
            image:
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
            description:
              'A coastal heritage site with a difficult colonial history, now part of remembrance and tourism in ǁKaras.',
            latitude: -26.636,
            longitude: 15.152,
          },
        ],
      },
      {
        title: 'Demographics & Languages',
        description:
          'Official languages, regional dialects, indigenous ethnic groups, and primary religions.',
        sites: [
          {
            id: 'cul-demo-1',
            name: 'Katutura Cultural Hub',
            image:
              'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1200&q=80',
            description:
              'A living community space reflecting Namibia’s multilingual society — Oshiwambo, Afrikaans, English, Nama/Damara, Herero, and more.',
            latitude: -22.5236,
            longitude: 17.0603,
          },
          {
            id: 'cul-demo-2',
            name: 'Oshakati Open Market Area',
            image:
              'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=1200&q=80',
            description:
              'A northern commercial and social hub where Oshiwambo language and everyday cultural life are highly visible.',
            latitude: -17.7883,
            longitude: 15.6989,
          },
          {
            id: 'cul-demo-3',
            name: 'Keetmanshoop Town Centre',
            image:
              'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80',
            description:
              'A southern regional centre reflecting Afrikaans, Nama, and Damara language communities of ǁKaras.',
            latitude: -26.576,
            longitude: 18.131,
          },
        ],
      },
      {
        title: 'Arts & Traditions',
        description:
          'Traditional music, dance, handicrafts, folklore, literature, and architectural styles.',
        sites: [
          {
            id: 'cul-arts-1',
            name: 'National Art Gallery of Namibia',
            image:
              'https://images.unsplash.com/photo-1518998053901-512fbfed4a4a?auto=format&fit=crop&w=1200&q=80',
            description:
              'Showcases Namibian painters, sculptors, and craft traditions from contemporary art to heritage design.',
            latitude: -22.5609,
            longitude: 17.0832,
          },
          {
            id: 'cul-arts-2',
            name: 'Omba Arts Trust Market',
            image:
              'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=80',
            description:
              'Craft and design space highlighting handmade Namibian jewellery, textiles, and community artisan work.',
            latitude: -22.57,
            longitude: 17.083,
          },
          {
            id: 'cul-arts-3',
            name: 'Swakopmund Craft Market',
            image:
              'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
            description:
              'Coastal craft stalls offering woodwork, stone carvings, and tourist-friendly traditional souvenirs.',
            latitude: -22.678,
            longitude: 14.526,
          },
        ],
      },
      {
        title: 'Festivals & Events',
        description:
          'Annual cultural celebrations, national holidays, religious festivals, and seasonal events.',
        sites: [
          {
            id: 'cul-fest-1',
            name: '/Ae//Gams Arts Festival Grounds',
            image:
              'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
            description:
              'A major Windhoek venue for music, dance, poetry, and community celebrations on Namibia’s cultural calendar.',
            latitude: -22.5708,
            longitude: 17.0836,
          },
          {
            id: 'cul-fest-2',
            name: 'Ongwediva Trade Fair Grounds',
            image:
              'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            description:
              'Northern Namibia’s well-known fair venue for exhibitions, entertainment, and regional gatherings.',
            latitude: -17.78,
            longitude: 15.77,
          },
          {
            id: 'cul-fest-3',
            name: 'Lüderitz Crayfish Festival Area',
            image:
              'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
            description:
              'Coastal festival setting celebrating seafood, music, and community life in southern Namibia.',
            latitude: -26.648,
            longitude: 15.154,
          },
        ],
      },
    ],
  },
  {
    id: 'history-sites',
    number: 3,
    title: 'History Sites',
    image:
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
    subtopics: [
      {
        title: 'UNESCO & Landmark Sites',
        description:
          'World Heritage sites, protected historic landscapes, and nationally recognised landmarks.',
        sites: [
          {
            id: 'hist-unesco-1',
            name: 'Twyfelfontein Rock Engravings',
            image:
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
            description:
              'UNESCO World Heritage Site with thousands of ancient San rock engravings.',
            latitude: -20.5958,
            longitude: 14.3722,
          },
          {
            id: 'hist-unesco-2',
            name: 'Namib Sand Sea',
            image:
              'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1200&q=80',
            description:
              'UNESCO-listed desert landscape of ancient dunes and fog-shaped ecosystems along the Namib coast.',
            latitude: -24.8,
            longitude: 15.2,
          },
          {
            id: 'hist-unesco-3',
            name: 'Cape Cross Seal Reserve Landmark',
            image:
              'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
            description:
              'Historic coastal landmark linked to early European exploration and one of the world’s largest cape fur seal colonies.',
            latitude: -21.771,
            longitude: 13.95,
          },
        ],
      },
      {
        title: 'Monuments & Memorials',
        description:
          'War memorials, independence monuments, colonial-era landmarks, and civic statues.',
        sites: [
          {
            id: 'hist-monument-1',
            name: 'Christuskirche, Windhoek',
            image:
              'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
            description:
              'Iconic Lutheran church overlooking Windhoek’s historic core — a key colonial-era landmark.',
            latitude: -22.5702,
            longitude: 17.0882,
          },
          {
            id: 'hist-monument-2',
            name: 'Heroes’ Acre',
            image:
              'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
            description:
              'National memorial honouring those who shaped Namibia’s liberation struggle and independence.',
            latitude: -22.6475,
            longitude: 17.0789,
          },
          {
            id: 'hist-monument-3',
            name: 'Reiterdenkmal Site, Windhoek',
            image:
              'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80',
            description:
              'Historic civic area linked to contested colonial monuments and debates about memory in the capital.',
            latitude: -22.5696,
            longitude: 17.0868,
          },
        ],
      },
      {
        title: 'Ancient Ruins & Rock Art',
        description:
          'Archaeological sites, rock engravings, prehistoric shelters, and excavation areas.',
        sites: [
          {
            id: 'hist-ruins-1',
            name: 'Brandberg Mountain',
            image:
              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
            description:
              'Namibia’s highest mountain and home of the famous White Lady rock painting.',
            latitude: -21.1489,
            longitude: 14.5772,
          },
          {
            id: 'hist-ruins-2',
            name: 'Erongo Rock Art Sites',
            image:
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
            description:
              'Mountain shelters and painted panels documenting ancient hunter-gatherer life in central-western Namibia.',
            latitude: -21.7,
            longitude: 15.7,
          },
          {
            id: 'hist-ruins-3',
            name: 'Apollo 11 Cave Area',
            image:
              'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=1200&q=80',
            description:
              'Archaeologically significant cave zone in southern Namibia linked to early rock art discoveries.',
            latitude: -27.75,
            longitude: 17.1,
          },
        ],
      },
      {
        title: 'Museums & Collections',
        description:
          'Regional museums, cultural centres, archival collections, and curated heritage exhibits.',
        sites: [
          {
            id: 'hist-museum-1',
            name: 'National Museum of Namibia',
            image:
              'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=1200&q=80',
            description:
              'Collections covering natural history, ethnography, and national heritage in Windhoek.',
            latitude: -22.5605,
            longitude: 17.0838,
          },
          {
            id: 'hist-museum-2',
            name: 'Swakopmund Museum',
            image:
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
            description:
              'Coastal museum covering German colonial history, natural history, and local community stories.',
            latitude: -22.6789,
            longitude: 14.5247,
          },
          {
            id: 'hist-museum-3',
            name: 'Tsumeb Museum',
            image:
              'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80',
            description:
              'Mining-heritage museum showcasing minerals, town history, and northern industrial culture.',
            latitude: -19.233,
            longitude: 17.716,
          },
        ],
      },
    ],
  },
  {
    id: 'events',
    number: 4,
    title: 'Events',
    image:
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
    subtopics: [
      {
        title: 'Cultural Celebrations',
        description:
          'Traditional ceremonies, community festivals, music and dance gatherings, and heritage weeks.',
        sites: [
          {
            id: 'evt-culture-1',
            name: 'Opuwo Cultural Gathering Area',
            image:
              'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1200&q=80',
            description:
              'A Kunene hub for Himba and local community celebrations — traditional dress, dance, and heritage gatherings.',
            latitude: -18.0611,
            longitude: 13.84,
          },
          {
            id: 'evt-culture-2',
            name: 'Olufuko Festival Grounds, Outapi',
            image:
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
            description:
              'Venue associated with the Olufuko cultural festival celebrating Ovambo initiation traditions and community life.',
            latitude: -17.503,
            longitude: 14.984,
          },
          {
            id: 'evt-culture-3',
            name: 'Okahandja Heritage Weekend Area',
            image:
              'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            description:
              'Town centre linked to Herero and Nama commemorations, processions, and cultural remembrance events.',
            latitude: -21.983,
            longitude: 16.917,
          },
        ],
      },
      {
        title: 'National Holidays',
        description:
          'Independence Day, Heroes’ Day, Workers’ Day, and other public commemorations.',
        sites: [
          {
            id: 'evt-holidays-1',
            name: 'Heroes’ Acre',
            image:
              'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
            description:
              'National memorial south of Windhoek for Heroes’ Day and independence commemorations.',
            latitude: -22.6475,
            longitude: 17.0789,
          },
          {
            id: 'evt-holidays-2',
            name: 'Independence Stadium, Windhoek',
            image:
              'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?auto=format&fit=crop&w=1200&q=80',
            description:
              'Major stadium used for national celebrations, sports events, and public holiday gatherings.',
            latitude: -22.612,
            longitude: 17.09,
          },
          {
            id: 'evt-holidays-3',
            name: 'Parliament Gardens',
            image:
              'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
            description:
              'Civic green space in Windhoek often used for public ceremonies and national holiday programmes.',
            latitude: -22.5689,
            longitude: 17.0839,
          },
        ],
      },
      {
        title: 'Religious Festivals',
        description:
          'Major faith-based celebrations, pilgrimages, and seasonal religious observances.',
        sites: [
          {
            id: 'evt-religious-1',
            name: 'St. Mary’s Cathedral, Windhoek',
            image:
              'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
            description:
              'Central place of worship hosting major Christian festivals and community observances.',
            latitude: -22.5628,
            longitude: 17.0839,
          },
          {
            id: 'evt-religious-2',
            name: 'Christuskirche, Windhoek',
            image:
              'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
            description:
              'Historic Lutheran church used for seasonal services and special religious celebrations.',
            latitude: -22.5702,
            longitude: 17.0882,
          },
          {
            id: 'evt-religious-3',
            name: 'Mosque Area, Windhoek',
            image:
              'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
            description:
              'Reference point for Namibia’s Muslim community festivals such as Eid celebrations in the capital.',
            latitude: -22.565,
            longitude: 17.078,
          },
        ],
      },
      {
        title: 'Seasonal & Tourism Events',
        description:
          'Trade fairs, sports events, tourism expos, harvest seasons, and local market days.',
        sites: [
          {
            id: 'evt-seasonal-1',
            name: 'Windhoek Showgrounds',
            image:
              'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            description:
              'Venue for trade fairs, agricultural shows, and tourism-linked events from across Namibia.',
            latitude: -22.575,
            longitude: 17.078,
          },
          {
            id: 'evt-seasonal-2',
            name: 'Swakopmund Strand Promenade',
            image:
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
            description:
              'Coastal event strip for markets, beach festivals, and seasonal tourism activities.',
            latitude: -22.6795,
            longitude: 14.525,
          },
          {
            id: 'evt-seasonal-3',
            name: 'Gobabis Agricultural Show Area',
            image:
              'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
            description:
              'Eastern Namibia venue linked to farming shows, livestock events, and seasonal rural markets.',
            latitude: -22.45,
            longitude: 18.97,
          },
        ],
      },
    ],
  },
  {
    id: 'gastronomy',
    number: 5,
    title: 'Gastronomy & Culinary Culture',
    image:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    subtopics: [
      {
        title: 'National & Regional Dishes',
        description:
          'Signature meals, iconic ingredients, and regional specialities.',
        sites: [
          {
            id: 'gas-dishes-1',
            name: 'Joe’s Beerhouse, Windhoek',
            image:
              'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
            description:
              'Well-known for Namibian game meats, local sides, and hearty regional flavours.',
            latitude: -22.5575,
            longitude: 17.0789,
          },
          {
            id: 'gas-dishes-2',
            name: 'The Stellenbosch Wine Bar Area, Windhoek',
            image:
              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
            description:
              'Dining precinct for modern Namibian plates, steaks, and contemporary restaurant culture.',
            latitude: -22.57,
            longitude: 17.085,
          },
          {
            id: 'gas-dishes-3',
            name: 'Swakopmund Seafood Strip',
            image:
              'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
            description:
              'Coastal restaurants known for fresh fish, oysters, and Atlantic seafood specialities.',
            latitude: -22.679,
            longitude: 14.527,
          },
        ],
      },
      {
        title: 'Street Food & Markets',
        description:
          'Popular local market foods, night markets, and traditional eating styles.',
        sites: [
          {
            id: 'gas-markets-1',
            name: 'Single Quarters Market, Katutura',
            image:
              'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
            description:
              'Famous for kapana (grilled meat) and vibrant everyday Namibian street-food culture.',
            latitude: -22.5208,
            longitude: 17.0589,
          },
          {
            id: 'gas-markets-2',
            name: 'Oshetu Community Market, Oshakati',
            image:
              'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
            description:
              'Northern market for fresh produce, dried fish, mahangu products, and regional snacks.',
            latitude: -17.79,
            longitude: 15.7,
          },
          {
            id: 'gas-markets-3',
            name: 'Whk Underground / Craft Market Stalls',
            image:
              'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=1200&q=80',
            description:
              'Urban craft and snack stalls where visitors sample casual local bites alongside handmade goods.',
            latitude: -22.568,
            longitude: 17.084,
          },
        ],
      },
      {
        title: 'Beverage Culture',
        description:
          'Traditional drinks, coffee or tea rituals, local spirits, wine, and craft beer industries.',
        sites: [
          {
            id: 'gas-drinks-1',
            name: 'Namibia Breweries, Windhoek',
            image:
              'https://images.unsplash.com/photo-1436076863939-06870fe779c2?auto=format&fit=crop&w=1200&q=80',
            description:
              'Home of Windhoek Lager and a landmark of Namibia’s brewing heritage.',
            latitude: -22.56,
            longitude: 17.07,
          },
          {
            id: 'gas-drinks-2',
            name: 'Kristall Kellerei, Omaruru',
            image:
              'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80',
            description:
              'Local winery and distillery known for Namibian wines and fruit-based spirits.',
            latitude: -21.418,
            longitude: 15.953,
          },
          {
            id: 'gas-drinks-3',
            name: 'Swakopmund Coffee District',
            image:
              'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
            description:
              'Café culture strip for coffee rituals, bakeries, and coastal social drinking habits.',
            latitude: -22.6785,
            longitude: 14.5265,
          },
        ],
      },
      {
        title: 'Dining Etiquette',
        description:
          'Tipping practices, dining hours, meal structure, and table manners.',
        sites: [
          {
            id: 'gas-etiquette-1',
            name: 'Zoo Park Dining Precinct',
            image:
              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
            description:
              'Central Windhoek cafés and restaurants for observing dining hours, tipping norms, and meal customs.',
            latitude: -22.5686,
            longitude: 17.0833,
          },
          {
            id: 'gas-etiquette-2',
            name: 'Independence Avenue Cafés',
            image:
              'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
            description:
              'Main-street dining strip where service styles, seating norms, and tip culture are easy to notice.',
            latitude: -22.5675,
            longitude: 17.0838,
          },
          {
            id: 'gas-etiquette-3',
            name: 'Swakopmund Jetty Restaurants',
            image:
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
            description:
              'Tourist-facing coastal dining where reservations, dress expectations, and service pacing differ from markets.',
            latitude: -22.681,
            longitude: 14.522,
          },
        ],
      },
    ],
  },
  {
    id: 'travel',
    number: 6,
    title: 'Practical Travel & Infrastructure',
    image:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    subtopics: [
      {
        title: 'Transportation Systems',
        description:
          'Domestic flight networks, rail connectivity, long-distance buses, road conditions, and urban public transit.',
        sites: [
          {
            id: 'trv-transport-1',
            name: 'Hosea Kutako International Airport',
            image:
              'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
            description:
              'Namibia’s main international gateway east of Windhoek for domestic and long-haul travel.',
            latitude: -22.4867,
            longitude: 17.4625,
          },
          {
            id: 'trv-transport-2',
            name: 'Windhoek Railway Station',
            image:
              'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80',
            description:
              'Historic rail hub reflecting Namibia’s passenger and freight rail connectivity.',
            latitude: -22.561,
            longitude: 17.0815,
          },
          {
            id: 'trv-transport-3',
            name: 'Intercape / Long-distance Bus Terminal Area',
            image:
              'https://images.unsplash.com/photo-1544620341-11cb2f9f9d1d?auto=format&fit=crop&w=1200&q=80',
            description:
              'Key long-distance coach area linking Windhoek with coastal and northern towns.',
            latitude: -22.56,
            longitude: 17.08,
          },
        ],
      },
      {
        title: 'Entry & Legal Requirements',
        description:
          'Visa policies, entry permits, customs rules, and local laws.',
        sites: [
          {
            id: 'trv-entry-1',
            name: 'Ministry of Home Affairs, Windhoek',
            image:
              'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
            description:
              'Civic offices related to immigration, permits, and legal entry processes.',
            latitude: -22.5602,
            longitude: 17.0835,
          },
          {
            id: 'trv-entry-2',
            name: 'Hosea Kutako Immigration Hall',
            image:
              'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
            description:
              'Primary arrival point where visas, declarations, and entry stamps are processed for air travellers.',
            latitude: -22.4867,
            longitude: 17.4625,
          },
          {
            id: 'trv-entry-3',
            name: 'Noordoewer Border Post',
            image:
              'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
            description:
              'Major land border with South Africa for road travellers entering southern Namibia.',
            latitude: -28.733,
            longitude: 17.617,
          },
        ],
      },
      {
        title: 'Currency & Payments',
        description:
          'Official currency, acceptance of credit cards vs. cash, and ATM access in remote areas.',
        sites: [
          {
            id: 'trv-currency-1',
            name: 'Bank of Namibia',
            image:
              'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=1200&q=80',
            description:
              'Central bank representing Namibia’s currency system (NAD) and national payment norms.',
            latitude: -22.568,
            longitude: 17.0855,
          },
          {
            id: 'trv-currency-2',
            name: 'Independence Avenue Bank Strip',
            image:
              'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
            description:
              'Cluster of commercial banks and ATMs for cash withdrawals and card services in Windhoek.',
            latitude: -22.5678,
            longitude: 17.0836,
          },
          {
            id: 'trv-currency-3',
            name: 'Swakopmund Main Street ATMs',
            image:
              'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80',
            description:
              'Tourist-heavy cash access point showing coastal card acceptance and ATM availability.',
            latitude: -22.678,
            longitude: 14.527,
          },
        ],
      },
      {
        title: 'Connectivity & Power',
        description:
          'Mobile network coverage (SIM/eSIM availability), power socket types, and Wi-Fi access.',
        sites: [
          {
            id: 'trv-connectivity-1',
            name: 'Telecom Namibia HQ Area',
            image:
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
            description:
              'Reference point for national telecom services, SIM access, and digital infrastructure.',
            latitude: -22.5615,
            longitude: 17.082,
          },
          {
            id: 'trv-connectivity-2',
            name: 'MTC Service Centre, Windhoek',
            image:
              'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=1200&q=80',
            description:
              'Popular mobile operator centre for local SIMs, data packages, and coverage support.',
            latitude: -22.566,
            longitude: 17.084,
          },
          {
            id: 'trv-connectivity-3',
            name: 'NamPower Reference Area',
            image:
              'https://images.unsplash.com/photo-1473341304500-94e30cbfa6bb?auto=format&fit=crop&w=1200&q=80',
            description:
              'Utility landmark representing Namibia’s electricity grid, sockets (Type D/M), and power infrastructure.',
            latitude: -22.56,
            longitude: 17.09,
          },
        ],
      },
    ],
  },
  {
    id: 'safety',
    number: 7,
    title: 'Safety, Health & Local Norms',
    image:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    subtopics: [
      {
        title: 'Health Precautions',
        description:
          'Required vaccinations, water potability, malaria or endemic disease risks, and emergency healthcare access.',
        sites: [
          {
            id: 'saf-health-1',
            name: 'Windhoek Central Hospital',
            image:
              'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
            description:
              'Major public hospital illustrating emergency healthcare access in the capital.',
            latitude: -22.5619,
            longitude: 17.0794,
          },
          {
            id: 'saf-health-2',
            name: 'Katutura State Hospital',
            image:
              'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80',
            description:
              'Large public hospital serving Windhoek’s northern suburbs and emergency referrals.',
            latitude: -22.53,
            longitude: 17.05,
          },
          {
            id: 'saf-health-3',
            name: 'Ondangwa / Northern Clinic Corridor',
            image:
              'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
            description:
              'Reference area for malaria-awareness and primary healthcare access in northern Namibia.',
            latitude: -17.9167,
            longitude: 15.95,
          },
        ],
      },
      {
        title: 'Safety & Security',
        description:
          'General crime rates, local scams, political stability, and areas requiring caution.',
        sites: [
          {
            id: 'saf-security-1',
            name: 'Namibian Police Force HQ',
            image:
              'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
            description:
              'National policing headquarters — a reference for public safety services and visitor security guidance.',
            latitude: -22.5595,
            longitude: 17.081,
          },
          {
            id: 'saf-security-2',
            name: 'Windhoek City Police Area',
            image:
              'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
            description:
              'Municipal policing reference point for urban safety tips and tourist assistance in the capital.',
            latitude: -22.567,
            longitude: 17.083,
          },
          {
            id: 'saf-security-3',
            name: 'Swakopmund Police Station Area',
            image:
              'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
            description:
              'Coastal safety reference for visitors in a busy tourism town with beachfront and CBD patrols.',
            latitude: -22.678,
            longitude: 14.53,
          },
        ],
      },
      {
        title: 'Social Norms & Taboos',
        description:
          'Dress codes (especially at religious sites), photo restrictions, public etiquette, and tipping expectations.',
        sites: [
          {
            id: 'saf-norms-1',
            name: 'Parliament Gardens, Windhoek',
            image:
              'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
            description:
              'Civic public space where respectful dress, photography etiquette, and everyday social norms matter.',
            latitude: -22.5689,
            longitude: 17.0839,
          },
          {
            id: 'saf-norms-2',
            name: 'Himba Village Visit Area near Opuwo',
            image:
              'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1200&q=80',
            description:
              'Community visit context where asking before photos and respecting cultural dress customs is essential.',
            latitude: -18.1,
            longitude: 13.85,
          },
          {
            id: 'saf-norms-3',
            name: 'Christuskirche Precinct',
            image:
              'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
            description:
              'Religious and civic landmark area highlighting modest dress and quiet behaviour expectations.',
            latitude: -22.5702,
            longitude: 17.0882,
          },
        ],
      },
    ],
  },
];

export function getExploreSiteById(siteId: string): RegionExploreSite | null {
  for (const category of REGION_EXPLORE_CATEGORIES) {
    for (const subtopic of category.subtopics) {
      const match = subtopic.sites.find((s) => s.id === siteId);
      if (match) return match;
    }
  }
  return null;
}

export function getExploreSiteContext(siteId: string): {
  category: RegionExploreCategory;
  subtopic: RegionExploreSubtopic;
  site: RegionExploreSite;
} | null {
  for (const category of REGION_EXPLORE_CATEGORIES) {
    for (const subtopic of category.subtopics) {
      const site = subtopic.sites.find((s) => s.id === siteId);
      if (site) return { category, subtopic, site };
    }
  }
  return null;
}

export function getSitesForCategory(categoryId: string): Array<{
  subtopicTitle: string;
  site: RegionExploreSite;
}> {
  const category = REGION_EXPLORE_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return [];
  return category.subtopics.flatMap((sub) =>
    sub.sites.map((site) => ({ subtopicTitle: sub.title, site }))
  );
}
