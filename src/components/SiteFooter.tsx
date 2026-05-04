const SiteFooter = () => {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto py-8 grid text-sm md:grid-cols-2 items-center gap-4">
        <div className="md:justify-self-start justify-self-center">
          <p className="font-semibold">Propbank</p>
          <p className="text-muted-foreground">Your Go-To Hub for Buying, Selling, and Renting.</p>
        </div>
        <div className="md:justify-self-end justify-self-center text-center md:text-right">
          <p>© {new Date().getFullYear()} Propbank. All rights reserved.</p>
          <div className="mt-1 flex items-center justify-center md:justify-end gap-1.5 text-blue-600">
            <span className="text-muted-foreground">Contact US:</span>
            <a href="mailto:connect@propbank.shop" className="hover:underline font-medium">
              connect@propbank.shop
            </a>
          </div>
        </div>
        {/* <div className="md:text-right">
          <a href="/" className="hover:underline">Home</a>
        </div> */}
      </div>
    </footer>
  );
};

export default SiteFooter;
