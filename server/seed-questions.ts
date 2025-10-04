import { db } from "./db";
import { questions, answers } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedQuestions() {
  console.log("🌱 Starting to seed questions and answers...\n");

  const questionsData = [
    {
      title: "How do I contact a vendor?",
      body: "I found a product I like and want to reach out to the seller. How can I contact them?",
      authorName: "Sarah Johnson",
      answers: [
        {
          body: "To contact a vendor on Orient, simply view any product listing and scroll down to the \"Contact Vendor\" section. You will find the vendor's phone number and email address displayed there. You can call them directly or send them an email to inquire about the product, discuss pricing, arrange pickup, or ask any questions you have. No account or login is required!",
          authorName: "Orient Support Team",
        },
      ],
    },
    {
      title: "How do I post an item for sale?",
      body: "I am a vendor and want to list my products on Orient. What are the steps to upload an item?",
      authorName: "Farm Owner Mike",
      answers: [
        {
          body: "Posting an item on Orient is easy! First, go to the home page and click the \"Post Item\" button at the top. You will see a form where you need to fill in: your vendor name, item name, description, price, category (vegetables, fruits, grains, or livestock), contact phone, contact email, and a password. You can also upload a photo of your product. The password is important - you will need it later if you want to delete your listing. Once you fill everything out, click \"Post Listing\" and your item will be live on the marketplace immediately!",
          authorName: "Farmer Joe",
        },
      ],
    },
    {
      title: "How do I browse products on Orient?",
      body: "I am new to Orient and want to see what products are available. How do I navigate the marketplace?",
      authorName: "New User",
      answers: [
        {
          body: "Browsing products on Orient is simple! When you open the app, you will see the home page with all available products displayed as cards. Each card shows the item name, vendor name, price, and category. You can scroll through all the listings to see what's available. If you want to see more details about a specific product, just tap on the product card and it will take you to the full product page with description, vendor contact information, and more details.",
          authorName: "Happy Customer",
        },
      ],
    },
    {
      title: "Can I filter products by category?",
      body: "I am only interested in certain types of products. Is there a way to filter what I see?",
      authorName: "Busy Shopper",
      answers: [
        {
          body: "Yes! Orient has a category filter to help you find exactly what you are looking for. At the top of the home page, you will see a dropdown menu labeled \"Filter by Category\". Click on it and you can choose from: All Categories, Vegetables, Fruits, Grains, or Livestock. Select the category you want and the page will instantly show only products from that category. This makes it much easier to find specific types of products without scrolling through everything!",
          authorName: "Tech Helper",
        },
      ],
    },
    {
      title: "Do I need to create an account to use Orient?",
      body: "I want to know if I need to sign up or register to browse and buy products.",
      authorName: "Anonymous User",
      answers: [
        {
          body: "No, you do not need to create an account to use Orient! The platform is designed to be simple and accessible for everyone. Buyers can browse all products and contact vendors without signing up or logging in. Vendors can post their products without creating an account - they just need to set a password for their listing so they can delete it later if needed. Orient is all about making it easy for farmers and buyers to connect without barriers!",
          authorName: "Orient Team",
        },
      ],
    },
    {
      title: "What is Orient?",
      body: "I just heard about Orient. Can someone explain what this platform is for?",
      authorName: "Curious Visitor",
      answers: [
        {
          body: "Orient is a mobile-friendly marketplace platform that connects farmers and food vendors with buyers in their community. It is designed specifically for local food producers to showcase their fresh products like vegetables, fruits, grains, and livestock. Buyers can browse available products, see prices, read descriptions, and contact vendors directly. The platform is simple to use - no complicated signup process, no lengthy forms. Just post your products or browse what is available, and connect directly with local producers and customers!",
          authorName: "Platform Admin",
        },
      ],
    },
    {
      title: "How do I edit or delete my listing?",
      body: "I posted an item but need to make changes or remove it. How can I do that?",
      authorName: "Vendor Anna",
      answers: [
        {
          body: "To delete your listing on Orient, go to the product page for the item you posted. At the bottom of the page, you will see a \"Delete Listing\" button. Click it and you will be asked to enter your vendor name and the password you set when you created the listing. Once you confirm, your listing will be permanently removed. Currently, Orient does not support editing listings - if you need to make changes, you will need to delete the old listing and create a new one with the updated information.",
          authorName: "Vendor Support",
        },
      ],
    },
    {
      title: "Are the products on Orient locally sourced?",
      body: "I prefer to buy local. Can I find farmers and food vendors from my area on Orient?",
      authorName: "Local Food Supporter",
      answers: [
        {
          body: "Yes! Orient is specifically designed for local farmers and food vendors in your area. All products listed on the platform come from local vendors, farmers, and small food producers in your community. When you view a product, you can see the vendor's contact information and reach out to them directly to learn more about where their products come from, their farming practices, and delivery or pickup options. By using Orient, you are supporting local businesses and your local food economy!",
          authorName: "Local Food Advocate",
        },
      ],
    },
    {
      title: "How do I contact Orient Expo?",
      body: "I have a question or need help with something on Orient. How can I reach out to the Orient team?",
      authorName: "Community Member",
      answers: [
        {
          body: "You can contact us directly through this Q&A section! Simply click the \"Ask Question\" button and write your question. In the title field, include \"for orient\" so we know it is directed to our team, and we will respond to your question as soon as possible. This is the best way to get help, report issues, or share feedback about the Orient platform.",
          authorName: "Orient Expo Team",
        },
      ],
    },
  ];

  let questionsAdded = 0;
  let answersAdded = 0;

  for (const questionData of questionsData) {
    // Check if question already exists
    const existing = await db
      .select()
      .from(questions)
      .where(eq(questions.title, questionData.title))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Question already exists: "${questionData.title}"`);
      continue;
    }

    // Insert question
    const [newQuestion] = await db
      .insert(questions)
      .values({
        title: questionData.title,
        body: questionData.body,
        authorName: questionData.authorName,
      })
      .returning();

    console.log(`✅ Added question: "${questionData.title}"`);
    questionsAdded++;

    // Insert answers for this question
    for (const answerData of questionData.answers) {
      await db.insert(answers).values({
        questionId: newQuestion.id,
        body: answerData.body,
        authorName: answerData.authorName,
      });

      answersAdded++;
    }
  }

  console.log("\n🎉 Seeding complete!");
  console.log(`   📝 Questions added: ${questionsAdded}`);
  console.log(`   💬 Answers added: ${answersAdded}`);
  console.log(`   ⏭️  Questions skipped (already exist): ${questionsData.length - questionsAdded}\n`);
}

// Run the seed function
seedQuestions()
  .then(() => {
    console.log("✨ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error seeding questions:", error);
    process.exit(1);
  });
