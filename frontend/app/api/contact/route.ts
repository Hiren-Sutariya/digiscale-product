import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, company, phone } = body;

    // Validate inputs
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    console.log("Contact form submission received:", {
      name,
      email,
      subject: subject || "No Subject",
      company: company || "N/A",
      phone: phone || "N/A",
      message,
    });

    // Here you would connect to a service like SendGrid, Resend, or save to database
    // For demonstration/testing, we return a successful response with simulated delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json(
      { message: "Thank you! Your message has been sent successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
