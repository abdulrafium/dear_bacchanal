import { Sparkles } from "lucide-react";

const Premium = () => {
  return (
    <section className="overflow-hidden bg-background">
      <div className="py-32 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <span className="text-primary font-handwritten text-xl mb-4 block">
                Premium Materials
              </span>
              <h2 className="font-display text-5xl md:text-6xl text-foreground mb-6 leading-tight">
                A COVER WORTH
                <span
                  className="block"
                  style={{
                    background:
                      "linear-gradient(90deg, #ec4899 0%, #fbbf24 50%, #10b981 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  KEEPING
                </span>
              </h2>

              <p className="text-muted-foreground text-lg mb-8">
                Each book features a stunning hardback cover with your choice of
                matte or gloss finish, designed to protect your memories for
                generations.
              </p>

              <div className="space-y-4">
                <FeatureListItem text='10" × 10" square format' />
                <FeatureListItem text="Hardback with protective laminate" />
                <FeatureListItem text="200gsm premium silk paper" />
                <FeatureListItem text="Lay-flat binding for seamless spreads" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-black/20 blur-3xl" />
              <img
                src="/book-cover-2.jpg"
                alt="Premium book cover"
                className="relative rounded-3xl shadow-2xl transform hover:rotate-2 hover:scale-[1.02] transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureListItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3 group">
    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-black/20 transition-all duration-300 group-hover:scale-110">
      <Sparkles className="w-3 h-3 text-yellow-500 group-hover:text-pink-500 transition-colors" />
    </div>
    <span className="text-foreground/80 group-hover:text-foreground transition-colors">
      {text}
    </span>
  </div>
);

export default Premium;
