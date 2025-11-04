import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container text-center py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h1 className="display-4 text-muted mb-4">404</h1>
          <h2 className="h3 mb-4">Destination Not Found</h2>
          <p className="text-muted mb-4">
            Sorry, we couldn&apos;t find the destination you&apos;re looking for. 
            It may have been moved or doesn&apos;t exist.
          </p>
          <Link 
            href="/pages/ExploreDestinations" 
            className="btn btn-primary btn-lg"
          >
            Explore All Destinations
          </Link>
        </div>
      </div>
    </div>
  );
}