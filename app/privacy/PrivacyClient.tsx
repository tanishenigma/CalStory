"use client";

import BlurFade from "@/app/components/animations/BlurFade";

import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/landing/Navbar";
import Footer from "@/app/footer";

export function PrivacyClient() {
  const router = useRouter();

  // Navbar's "Get Started" / mobile "Login" buttons route through here.
  // Delegate to /auth so the user lands on the dedicated sign-in surface.
  function handleSignIn() {
    router.push("/auth");
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar onSignIn={handleSignIn} />

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-4xl mx-auto w-full min-h-[80vh]">
        <BlurFade delay={0.1}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 font-heading">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="text-muted-foreground mb-12">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </BlurFade>

        <BlurFade
          delay={0.2}
          className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80">
          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                1. Introduction
              </h2>
              <p>
                At CalStory, we take your privacy seriously. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you visit our application. Please read this
                privacy policy carefully. If you do not agree with the terms of
                this privacy policy, please do not access the application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                2. Information We Collect
              </h2>
              <p>
                We collect information that you voluntarily provide to us when
                you register on the application, express an interest in
                obtaining information about us or our products and services,
                when you participate in activities on the application, or
                otherwise when you contact us.
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>
                  <strong>Personal Information:</strong> We may collect personal
                  information such as your name, email address, and profile
                  picture provided through third-party authentication services
                  (e.g., Google).
                </li>
                <li>
                  <strong>Health Data:</strong> To provide our core services, we
                  collect data such as weight, height, age, meal logs, and
                  workout history.
                </li>
                <li>
                  <strong>Usage Data:</strong> We may automatically collect
                  information regarding your interaction with our application.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                3. How We Use Your Information
              </h2>
              <p>
                Having accurate information about you permits us to provide you
                with a smooth, efficient, and customized experience.
                Specifically, we may use information collected about you via the
                application to:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Create and manage your account.</li>
                <li>
                  Calculate nutritional and fitness metrics tailored to your
                  profile.
                </li>
                <li>
                  Improve our services and AI-driven logging capabilities.
                </li>
                <li>Respond to customer service requests and support needs.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                4. Disclosure of Your Information
              </h2>
              <p>
                We may share information we have collected about you in certain
                situations. Your information may be disclosed as follows:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>
                  <strong>By Law or to Protect Rights:</strong> If we believe
                  the release of information about you is necessary to respond
                  to legal process or to investigate or remedy potential
                  violations of our policies.
                </li>
                <li>
                  <strong>Third-Party Service Providers:</strong> We may share
                  your information with third parties that perform services for
                  us or on our behalf, including data analysis, email delivery,
                  hosting services, and customer service (e.g., Firebase, Google
                  Gemini API).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                5. Security of Your Information
              </h2>
              <p>
                We use administrative, technical, and physical security measures
                to help protect your personal information. While we have taken
                reasonable steps to secure the personal information you provide
                to us, please be aware that despite our efforts, no security
                measures are perfect or impenetrable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                6. Your Data Rights
              </h2>
              <p>
                Depending on your location, you may have rights regarding your
                personal data, including the right to access, correct, or delete
                your personal data. You can manage your data within the
                application settings or by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                7. Contact Us
              </h2>
              <p>
                If you have questions or comments about this Privacy Policy,
                please contact us through our official GitHub repository.
              </p>
            </section>
          </div>
        </BlurFade>
      </main>

      <Footer />
    </div>
  );
}
