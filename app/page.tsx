import Hero from "@/components/hero";
import Footer from "@/components/footer";
import Navbar from '@/components/navbar';
import { homeMetadata } from './metadata'

export const metadata = homeMetadata

export default function Home() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <Hero />
            <Footer />
        </div>
    );
}



