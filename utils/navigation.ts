export type RootStackParamList = {
    Home: undefined;
    Search: undefined;
    Notifications: undefined;
    Category: { categoryId: string };
    Merchant: { merchantId: string };
    ProductDetail: { listingId: string };
};

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}