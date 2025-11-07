const SiteFooter = () => {
  return (
    <footer className="fixed left-0 right-0 bottom-0 border-t pb-[15px] bg-white z-50">
      <div className="container mx-auto py-4 grid text-sm md:grid-cols-2 items-center">
        <div className="md:justify-self-start justify-self-center">
          <p className="font-semibold">ShoPROP</p>
          <p className="text-muted-foreground">Real estate, simplified.</p>
        </div>
        <div className="md:justify-self-end justify-self-center">
          <p>© {new Date().getFullYear()} ShoPROP. All rights reserved.</p>
        </div>
        {/* <div className="md:text-right">
          <a href="/" className="hover:underline">Home</a>
        </div> */}
      </div>
    </footer>
  );
};

export default SiteFooter;
