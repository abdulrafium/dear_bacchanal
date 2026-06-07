
const HP_API_BASE_URL = "https://orders.oneflow.io/api";
const HP_API_KEY = process.env.HP_SITE_FLOW_API_KEY;
const HP_API_SECRET = process.env.HP_SITE_FLOW_API_SECRET;

import crypto from 'crypto';

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
    shippingMethod?: string;
}

interface OrderData {
    sourceOrderId: string;
    items: OrderItem[];
    shippingInfo: ShippingInfo;
}

export class HPSiteFlowClient {
    private apiKey: string;
    private apiSecret: string;

    constructor() {
        if (!HP_API_KEY || !HP_API_SECRET) {
            console.error("HP_SITE_FLOW_API_KEY or HP_SITE_FLOW_API_SECRET is not defined");
        }
        this.apiKey = HP_API_KEY || "602992397545";
        this.apiSecret = HP_API_SECRET || "df0a55737c3fc3d50d7c2c50cd2b4f913ff587847a477e13";
    }

    private generateSignature(method: string, path: string, timestamp: string) {
        const stringToSign = `${method} ${path} ${timestamp}`;
        const signature = crypto.createHmac('sha1', this.apiSecret)
            .update(stringToSign)
            .digest('hex');
        return signature;
    }

    private getHeaders(method: string, path: string) {
        const timestamp = new Date().toISOString();
        const signature = this.generateSignature(method, path, timestamp);

        const headers: HeadersInit = {
            "Content-Type": "application/json",
            "x-oneflow-date": timestamp,
            "x-oneflow-authorization": `${this.apiKey}:${signature}`
        };
        return headers;
    }

    async createOrder(orderData: OrderData) {
        const path = "/api/order";
        
        // Determine carrier alias based on shipping method logic (standard vs international)
        const carrierAlias = orderData.shippingInfo.shippingMethod === 'international' ? 'international' : 'standard';

        const payload = {
            destination: {
                name: "pureprint"
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
                        alias: carrierAlias
                    }
                }]
            }
        };

        try {
            const response = await fetch(`${HP_API_BASE_URL}/order`, {
                method: "POST",
                headers: this.getHeaders("POST", path),
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);

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

    async fetchCountries() {
        const path = "/api/reference/country";
        try {
            const response = await fetch(`${HP_API_BASE_URL}/reference/country`, {
                method: "GET",
                headers: this.getHeaders("GET", path)
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch countries from Site Flow:", e);
            return null;
        }
    }

    async fetchCities(countryCode: string) {
        const path = `/api/reference/city?country=${countryCode}`;
        try {
            const response = await fetch(`${HP_API_BASE_URL}/reference/city?country=${countryCode}`, {
                method: "GET",
                headers: this.getHeaders("GET", path)
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch cities from Site Flow:", e);
            return null;
        }
    }
}
