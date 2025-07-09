import Link from "next/link";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faInstagram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

const FooterSection = () => {
  return (
    <footer className="border-t border-gray-200 py-20">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-xl font-bold">
            Black Gold&nbsp;
            <span className="text-yellow-500 font-light hover:!text-yellow-300"
            >
            &nbsp;Africa Traders Ltd
            </span>
          </div>
          <nav className="mb-4">
            <ul className="flex space-x-6">
              <li>
                <Link href="/discover">About Us</Link>
              </li>
              {/*<li>*/}
              {/*  <Link href="/contact">Contact Us</Link>*/}
              {/*</li>*/}
              <li>
                <Link href="/explore">Explore</Link>
              </li>
              {/*<li>*/}
              {/*  <Link href="/terms">Terms</Link>*/}
              {/*</li>*/}
              <li>
                <Link href="/privacyPolicy">Privacy Policy</Link>
              </li>
            </ul>
          </nav>
          <div className="flex space-x-4 mb-4">
            <span
              aria-label="Facebook"
              className="hover:text-primary-600"
            >
              <FontAwesomeIcon icon={faFacebook} className="h-6 w-6" />
            </span>
            <span
              aria-label="Instagram"
              className="hover:text-primary-600"
            >
              <FontAwesomeIcon icon={faInstagram} className="h-6 w-6" />
            </span>
            <span
              aria-label="Linkedin"
              className="hover:text-primary-600"
            >
              <FontAwesomeIcon icon={faLinkedin} className="h-6 w-6" />
            </span>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-gray-500 flex justify-center space-x-4">
          <span>&copy; 2025 Black Gold Africa Traders Ltd. All rights reserved.</span>
          <Link
              href="/privacyPolicy"
              className="text-green-500 underline hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Privacy Policy
          </Link>

        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
