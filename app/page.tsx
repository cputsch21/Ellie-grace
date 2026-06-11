import Hero from "@/components/Hero";
import OrderBuilder from "@/components/OrderBuilder";
import MeetUs from "@/components/MeetUs";
import SiteFooter from "@/components/SiteFooter";
import { PRODUCTS } from "@/lib/products";

export default function Home() {
  return (
    <main>
      <Hero />
      <OrderBuilder products={PRODUCTS} />
      <MeetUs />
      <SiteFooter />
    </main>
  );
}
