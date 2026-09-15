import { prisma } from './utils/prismaConnection.js';

async function main() {
  const seasonsData = [
    {
      title: "Winter Special",
      slug: "winter-tours-in-india",
      season: "winter",
      seoTitle: "Winter Tours in India | Palaces, Deserts & Beaches",
      h1Title: "A Royal Winter Journey",
      seoDescription: "Are you planning to visit the Royal Palaces of Rajasthan and experience the sunny beaches of Goa? Check out our premium winter packages!",
      overView: "Are you planning to visit the majestic Royal Palaces of Rajasthan and experience the sunny tropical beaches of Goa in perfect weather?\n\nFlag Journeys brings you the perfect itinerary where you can freely explore the grand forts and truly enjoy cruising the serene Kerala backwaters. This winter travel plan is designed exclusively for you.\n\nCheck out our premium tour packages below and book your ideal trip! 👇",
      moreDescription: "Winter (November to February) is the undisputed crown jewel of Indian travel. The harsh heat is gone, replaced by crisp mornings and delightfully sunny afternoons—the absolute sweet spot for international travelers. Whether you want to witness the Taj Mahal in perfectly clear air or sink your toes into the sand in Goa, this is the time to pack your bags. Flag Journeys ensures a deeply immersive and luxurious experience.",
      weather: "10°C to 25°C (Crisp mornings, sun-drenched afternoons)",
      bestFor: "The Golden Triangle, Royal Rajasthan, Goan Coastlines, Kerala Backwaters",
      festivals: "Diwali (Festival of Lights), Pushkar Camel Fair, Christmas in Goa",
      thumbImg: "/destinationImage/image/agra-6.webp",
      banner: {
        images: ["/destinationImage/image/agra-6.webp"],
        bannerTitle: "Winter in India (Nov - Feb)",
        bannerTag: "Nov - Feb Peak Season"
      }
    },
    {
      title: "Spring Escapes",
      slug: "spring-tours-in-india",
      season: "spring",
      seoTitle: "Spring Tours in India | Tiger Tracking & Cultural Festivals",
      h1Title: "The Call of the Wild",
      seoDescription: "Are you planning to visit Ranthambore and experience tracking wild Bengal tigers? Check out our premium spring tour packages!",
      overView: "Are you planning to visit the legendary Ranthambore National Park and experience tracking wild Bengal tigers?\n\nFlag Journeys brings you the perfect itinerary where you can freely explore the wild Indian jungles and truly enjoy celebrating the vibrant festival of Holi. This spring travel plan is designed exclusively for you.\n\nCheck out our premium tour packages below and book your ideal trip! 👇",
      moreDescription: "For the wildlife enthusiast, there is no better window than spring (March to April). As the dry season progresses, vegetation thins out, drawing magnificent Bengal tigers out into the open. It's an energetic, adventurous time to visit. The air is warm, the days are bright, and whether you are sipping fresh tea in Darjeeling or exploring Delhi, the vibe is purely electric. Travel with Flag Journeys for expert-guided tiger safaris and premium cultural experiences.",
      weather: "20°C to 35°C (Warm, bright, and highly energetic)",
      bestFor: "Tiger Safaris, Wildlife Photography, Tea Plantations, Cultural Immersion",
      festivals: "Holi (The legendary festival of colors), Elephant Festival",
      thumbImg: "/destinationImage/image/agra-5.webp",
      banner: {
        images: ["/destinationImage/image/agra-5.webp"],
        bannerTitle: "Spring in India (Mar - Apr)",
        bannerTag: "Mar - Apr Wildlife Season"
      }
    },
    {
      title: "Summer Retreats",
      slug: "summer-tours-in-india",
      season: "summer",
      seoTitle: "Summer Tours in India | Himalayan Expeditions & Spiritual Retreats",
      h1Title: "Sanctuary in the Clouds",
      seoDescription: "Are you planning to visit the breathtaking Himalayas and experience ancient Buddhist monasteries? Discover our premium summer tours!",
      overView: "Are you planning to visit the breathtaking Himalayan mountains and experience exploring the ancient Buddhist monasteries in Ladakh?\n\nFlag Journeys brings you the perfect itinerary where you can freely explore the high-altitude lakes and truly enjoy the cool, fresh mountain air. This summer travel plan is designed exclusively for you.\n\nCheck out our premium tour packages below and book your ideal trip! 👇",
      moreDescription: "While the plains bake under the May-to-July sun, the great Indian Himalayas thaw, unlocking routes to the most mystical landscapes on Earth. High-altitude deserts like Ladakh and Spiti become accessible, revealing jagged peaks, crystal-clear turquoise lakes, and pure, thin mountain air. It is the ultimate escape for those seeking peace and epic adventure. Let Flag Journeys plan your seamless Himalayan expedition with top-tier comfort and expert local guides.",
      weather: "15°C to 25°C in the mountains (Chilly winds, strong sunshine)",
      bestFor: "Leh-Ladakh Road Trips, Kashmir Houseboats, Trekking, Monastic Retreats",
      festivals: "Hemis Festival (Spectacular masked dances in Ladakh)",
      thumbImg: "/destinationImage/image/agra-1.webp",
      banner: {
        images: ["/destinationImage/image/agra-1.webp"],
        bannerTitle: "Summer in India (May - Jul)",
        bannerTag: "May - Jul Mountain Season"
      }
    },
    {
      title: "Monsoon Wonders",
      slug: "monsoon-tours-in-india",
      season: "monsoon",
      seoTitle: "Monsoon Tours in India | Slow Travel & Ayurvedic Healing",
      h1Title: "The Emerald Reawakening",
      seoDescription: "Are you planning to visit the lush Western Ghats and experience Ayurvedic healing in Kerala? Check out our premium monsoon packages!",
      overView: "Are you planning to visit the incredibly lush Western Ghats and experience authentic Ayurvedic healing in Kerala?\n\nFlag Journeys brings you the perfect itinerary where you can freely explore the rain-washed palaces of Udaipur and truly enjoy witnessing the roaring waterfalls of Meghalaya. This monsoon travel plan is designed exclusively for you.\n\nCheck out our premium tour packages below and book your ideal trip! 👇",
      moreDescription: "From August to October, the monsoon sweeps across the subcontinent, transforming the landscape into an impossibly vibrant shade of emerald green. According to ancient texts, this moist, cool climate makes it the supreme season for authentic Ayurvedic healing and detox retreats. It’s quieter, intensely poetic, and the perfect time for a slow, soulful journey. Trust Flag Journeys to arrange your serene wellness retreat at India's most luxurious Ayurvedic resorts.",
      weather: "22°C to 30°C (Humid, misty, and wonderfully overcast)",
      bestFor: "Ayurvedic Detox, Udaipur's Lake Palaces, Waterfalls of Meghalaya, Slow Travel",
      festivals: "Onam (Kerala's Harvest Celebration), Ganesh Chaturthi",
      thumbImg: "/destinationImage/image/agra-2.webp",
      banner: {
        images: ["/destinationImage/image/agra-2.webp"],
        bannerTitle: "Monsoon in India (Aug - Oct)",
        bannerTag: "Aug - Oct Ayurveda Season"
      }
    }
  ];

  for (const data of seasonsData) {
    const { banner, ...monthData } = data;
    
    let month = await prisma.month.findUnique({ where: { slug: monthData.slug } });
    
    if (month) {
      month = await prisma.month.update({
        where: { id: month.id },
        data: monthData
      });
      console.log(`Updated by slug: ${month.title}`);
    } else {
      let existingBySeason = await prisma.month.findFirst({ where: { season: monthData.season } });
      if (existingBySeason) {
        month = await prisma.month.update({
          where: { id: existingBySeason.id },
          data: monthData
        });
        console.log(`Updated by season field: ${month.title}`);
      } else {
        month = await prisma.month.create({
          data: monthData
        });
        console.log(`Created: ${month.title}`);
      }
    }

    // Handle Banner
    const existingBanner = await prisma.banner.findFirst({
      where: { entityType: "Month", entityId: month.id }
    });

    if (existingBanner) {
      await prisma.banner.update({
        where: { id: existingBanner.id },
        data: {
          images: banner.images,
          bannerTitle: banner.bannerTitle,
          bannerTag: banner.bannerTag
        }
      });
      console.log(`Updated banner for: ${month.title}`);
    } else {
      await prisma.banner.create({
        data: {
          images: banner.images,
          bannerTitle: banner.bannerTitle,
          bannerTag: banner.bannerTag,
          entityType: "Month",
          entityId: month.id
        }
      });
      console.log(`Created banner for: ${month.title}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
