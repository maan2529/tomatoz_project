import Loader from "./component/Loader"
import { BackgroundLines } from "@/components/ui/background-lines"
import ThreeDCardDemo from "./component/ThreeDCardDemo"

const Home = () => {
  const data = {
    title: "Blog Smarter, Not Harder.",
    description:
      "brings updates to life — blogs, podcasts, visuals — all automatically. Read it. Hear it. See it. Every story, every idea, instantly alive.",
  };

  const cardData = [
    {
      title: "Instant Blogs & Visual Insights",
      description:
        "Generate ready-to-read blogs and AI-powered visuals from real-time insights in seconds.",
      imageSrc: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
      imageAlt: "Instant Blogs and Visual Insights",
      linkHref: "https://www.google.com",
      linkText: "Create Content",
    },
    {
      title: "Voices That Bring Content to Life",
      description:
        "Transform your blogs into immersive podcasts or audiobooks with AI-generated voices. Engage your audience with content they can listen to anywhere.",
      imageSrc: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
      imageAlt: "AI Podcasts and Audiobooks",
      linkHref: "https://www.google.com",
      linkText: "Convert to Audio",
    },
  ];

  return (
    <div>
      <BackgroundLines className="flex items-center justify-center w-full flex-col gap-10 px-4 text-white">
        <Loader />
        <div
          style={{
            marginTop: "10vh",
          }}
          className="flex flex-col items-center justify-center px-6 py-20 gap-3 text-center"
        >
          <h1 style={{ fontSize: "2.5rem", fontWeight: 700 }}>{data.title}</h1>
          <p style={{ maxWidth: "640px", lineHeight: 1.7, color: "gray" }}>
            {data.description}
          </p>
        </div>
        <div className="flex items-center justify-center w-full hidden md:flex flex-row gap-10 px-4 text-white">
          {cardData.map((item, index) => (
            <ThreeDCardDemo key={index} title={item.title} description={item.description} imageSrc={item.imageSrc} imageAlt={item.imageAlt} linkHref={item.linkHref} linkText={item.linkText} />
          ))}
        </div>
      </BackgroundLines>
      <div className="flex h-[110vh] bg-black items-center justify-center w-full flex-col md:hidden gap-10 px-4 text-white">
        {cardData.map((item, index) => (
          <ThreeDCardDemo key={index} title={item.title} description={item.description} imageSrc={item.imageSrc} imageAlt={item.imageAlt} linkHref={item.linkHref} linkText={item.linkText} />
        ))}
      </div>
      <div className="h-full bg-black">

      </div>
    </div>
  )
}

export default Home
