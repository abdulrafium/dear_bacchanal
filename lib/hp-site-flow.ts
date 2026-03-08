
const HP_API_BASE_URL = "https://pro-api.oneflowcloud.com/api";
const HP_API_KEY = process.env.HP_SITE_FLOW_API_KEY;
const HP_API_SECRET = process.env.HP_SITE_FLOW_API_SECRET; // If needed, though prompt only mentioned Key

interface OrderItem {
    sourceItemId: string;
    sku: string;
    quantity: number;
    components: Array<{
        code: string;
        path: string;
        fetch: boolean;
    }>
}

interface ShippingInfo {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    email: string;
    phone?: string;
}

interface OrderData {
    sourceOrderId: string;
    items: OrderItem[];
    shippingInfo: ShippingInfo;
}

export class HPSiteFlowClient {
    private apiKey: string;
    private apiSecret?: string;

    constructor() {
        if (!HP_API_KEY) {
            console.error("HP_SITE_FLOW_API_KEY is not defined");
        }
        this.apiKey = HP_API_KEY || "";
        this.apiSecret = HP_API_SECRET;
    }

    private getHeaders() {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
            "x-oneflow-authorization": `${this.apiKey}:${this.apiSecret || ""}`
        };
        return headers;
    }

    async createOrder(orderData: OrderData) {
        // Construct the payload based on HP Site Flow requirements
        // Notes from docs:
        // POST /order

        const payload = {
            destination: {
                name: "oneflow"
            },
            orderData: {
                sourceOrderId: orderData.sourceOrderId,
                items: orderData.items.map(item => ({
                    sourceItemId: item.sourceItemId,
                    sku: item.sku,
                    quantity: item.quantity,
                    components: item.components
                })),
                shipments: [{
                    shipTo: {
                        name: orderData.shippingInfo.name,
                        address1: orderData.shippingInfo.line1,
                        address2: orderData.shippingInfo.line2 || "",
                        town: orderData.shippingInfo.city,
                        state: orderData.shippingInfo.state || "",
                        postcode: orderData.shippingInfo.postalCode,
                        isoCountry: orderData.shippingInfo.country,
                        email: orderData.shippingInfo.email,
                        phone: orderData.shippingInfo.phone || ""
                    },
                    carrier: {
                        code: "royal_mail", // Defaulting to a carrier, might need logic to select
                        service: "first_class"
                    }
                }]
            }
        };

        try {
            const response = await fetch(`${HP_API_BASE_URL}/order`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("HP Site Flow Order Creation Failed:", data);
                throw new Error(`HP Site Flow Error: ${JSON.stringify(data)}`);
            }

            return data;

        } catch (error) {
            console.error("Error creating HP Site Flow order:", error);
            throw error;
        }
    }

    async validateOrder(orderData: OrderData) {
        const payload = {
            destination: {
                name: "oneflow"
            },
            orderData: {
                sourceOrderId: orderData.sourceOrderId,
                items: orderData.items,
                shipments: [{
                    shipTo: {
                        name: orderData.shippingInfo.name,
                        address1: orderData.shippingInfo.line1,
                        address2: orderData.shippingInfo.line2 || "",
                        town: orderData.shippingInfo.city,
                        state: orderData.shippingInfo.state || "",
                        postcode: orderData.shippingInfo.postalCode,
                        isoCountry: orderData.shippingInfo.country,
                        email: orderData.shippingInfo.email,
                        phone: orderData.shippingInfo.phone || ""
                    }
                }]
            }
        };

        const response = await fetch(`${HP_API_BASE_URL}/order/validate`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(payload)
        });

        return response.json();
    }
}
