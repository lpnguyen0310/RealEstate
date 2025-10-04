import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import AppRoutes from "./routes/appRoutes";

export default function App() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <AppRoutes />
      </main>
      <Footer />
    </>
  );
}
