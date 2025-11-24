import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";

interface ThreeDCardDemoProps {
  className?: string;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  linkHref?: string;
  linkText?: string;
}

export default function ThreeDCardDemo({
  className = "",
  title,
  description,
  imageSrc,
  imageAlt,
  linkHref,
  linkText
}: ThreeDCardDemoProps) {
  return (
    <CardContainer className={`inter-var max-w-xs px-30 py-20 ${className}`}>
      <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.08] bg-transparent dark:border-white/[0.2] border-black/[0.1] w-full sm:w-[18rem] h-auto rounded-lg p-4 border">
        <CardItem translateZ="50" style={{ fontSize: "1.2rem", color: "white" }} className="text-base font-semibold text-neutral-600 py-10 dark:text-white">
          {title}
        </CardItem>
        <CardItem as="p" translateZ="60" className="text-neutral-500 text-xs max-w-xs mt-1.5 dark:text-neutral-300">
          {description}
        </CardItem>
        {imageSrc && (
          <CardItem translateZ="80" className="w-full" style={{ padding: "1rem 0em" }}>
            <img
              src={imageSrc}
              height="1000"
              width="1000"
              className="h-40 w-full object-cover rounded-lg group-hover/card:shadow-lg"
              alt={imageAlt}
            />
          </CardItem>
        )}
        <div className="flex justify-between items-center mt-8">
          {linkHref && linkText && (
            <CardItem translateZ={20} as="a" href={linkHref} target="__blank" className="px-3 py-1.5 rounded-lg text-[11px] font-normal dark:text-white">
              {linkText} →
            </CardItem>
          )}
        </div>
      </CardBody>
    </CardContainer>
  );
}
