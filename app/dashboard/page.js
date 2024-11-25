import Navbar from "@/components/layout/NavBar";
import Link from "next/link";


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-white">
        <Navbar />

      <div className="mt-40" />
                   
                    <main className="flex flex-col items-center mt-10 px-4 md:px-0">
                        <div className="flex flex-col md:flex-row items-center">
                            <img src="/hero.png" alt="Illustration of diverse women high-fiving" className="w-full md:w-1/2 mb-8 md:mb-0 md:mr-8"/>
                            <div className="text-center md:text-left">
                                <h1 className="text-3xl md:text-5xl font-bold mb-4">Welcome!</h1>
                                <p className="text-lg max-w-2xl mt-20">
                                    WomenConnect envisions a future where women’s narratives serve as catalysts for transformation and every African woman's voice is valued, where her stories are a source of strength, and where her empowerment contributes to the advancement of society as a whole.
                                </p>
                            </div>
                        </div>
                    </main>
                </div>
  );
}