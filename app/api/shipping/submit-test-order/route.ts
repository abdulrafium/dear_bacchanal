import { NextRequest, NextResponse } from "next/server";
import { HPSiteFlowClient } from "@/lib/hp-site-flow";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { shippingInfo } = body;

        if (!shippingInfo) {
            return NextResponse.json({ error: "Missing shipping info" }, { status: 400 });
        }

        const client = new HPSiteFlowClient();

        // Generate unique IDs for the test order as requested by the client
        const timestamp = Date.now().toString(); // 13 chars
        const sourceOrderId = `T-${timestamp}`; // 15 chars max
        const sourceItemId = `I-${timestamp}`;

        const testOrderData = {
            sourceOrderId: sourceOrderId,
            shippingInfo: shippingInfo,
            items: [
                {
                    sourceItemId: sourceItemId,
                    sku: "saffatrinidad_hardback_10x10_staging",
                    quantity: 1,
                    components: [
                        {
                            code: "cover",
                            path: "https://testcover.pdf",
                            fetch: true
                        },
                        {
                            code: "text",
                            path: "https://testtext.pdf",
                            fetch: true
                        }
                    ]
                }
            ]
        };

        console.log(`Submitting test order to HP SiteFlow: ${sourceOrderId}`);
        const result = await client.createOrder(testOrderData);

        return NextResponse.json({
            success: true,
            sourceOrderId: sourceOrderId,
            siteFlowResponse: result
        });

    } catch (error: any) {
        console.error("Test Order Submission Error:", error);
        return NextResponse.json({ 
            error: "Failed to submit staging order", 
            details: error.message || String(error)
        }, { status: 500 });
    }
}
