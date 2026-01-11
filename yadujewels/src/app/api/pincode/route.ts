import { NextRequest, NextResponse } from "next/server";

interface PostOffice {
  Name: string;
  District: string;
  State: string;
}

interface PincodeAPIResponse {
  Status: string;
  Message: string;
  PostOffice: PostOffice[] | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode");

  // Validate pincode
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { success: false, error: "Invalid pincode. Must be 6 digits." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      {
        headers: {
          "Accept": "application/json",
        },
        // Cache for 24 hours since pincode data rarely changes
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data: PincodeAPIResponse[] = await response.json();

    if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length) {
      const postOffice = data[0].PostOffice[0];
      return NextResponse.json({
        success: true,
        city: postOffice.District,
        state: postOffice.State,
        postOffices: data[0].PostOffice.map((po) => ({
          name: po.Name,
          district: po.District,
          state: po.State,
        })),
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "No data found for this pincode",
      });
    }
  } catch (error) {
    console.error("[Pincode API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pincode details" },
      { status: 500 }
    );
  }
}
