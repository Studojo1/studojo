import { motion } from "framer-motion";

const floatA = {
  y: [0, -16, 0],
  x: [0, 24, 0],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

const floatB = {
  y: [0, 14, 0],
  x: [0, -24, 0],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut",
    delay: 1.5,
  },
};

/** Document-style card, -12° rotation */
export function FloatingCardA() {
  return (
    <motion.div
      className="shrink-0"
      animate={floatA}
      aria-hidden
    >
      <svg
        width="207"
        height="226"
        viewBox="0 0 207 226"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[180px] w-auto md:h-[226px] md:w-[207px]"
      >
        <g clipPath="url(#clip0_floating_card_a)">
          <path
            d="M132.834 17.0967L32.9413 38.3295C27.6871 39.4463 24.3331 44.611 25.4499 49.8652L54.2658 185.433C55.3826 190.687 60.5473 194.041 65.8015 192.925L165.694 171.692C170.948 170.575 174.302 165.41 173.185 160.156L144.369 24.5881C143.252 19.3339 138.088 15.9799 132.834 17.0967Z"
            fill="#191A23"
          />
          <path
            d="M127.066 13.351L27.1732 34.5838C21.919 35.7006 18.565 40.8653 19.6818 46.1195L48.4977 181.688C49.6145 186.942 54.7792 190.296 60.0334 189.179L159.926 167.946C165.18 166.829 168.534 161.665 167.417 156.41L138.601 20.8424C137.484 15.5882 132.32 12.2342 127.066 13.351Z"
            fill="white"
            stroke="#191A23"
            strokeWidth="4.86304"
          />
          <path
            d="M40.375 61.6078L99.8347 48.9692"
            stroke="#8B5CF6"
            strokeWidth="4.86304"
            strokeLinecap="round"
          />
          <path
            d="M45.4307 85.3916L131.053 67.1921"
            stroke="#8B5CF6"
            strokeWidth="4.86304"
            strokeLinecap="round"
          />
          <path
            d="M50.4858 109.176L124.216 93.5037"
            stroke="#8B5CF6"
            strokeWidth="4.86304"
            strokeLinecap="round"
          />
          <path
            d="M55.5415 132.959L141.163 114.76"
            stroke="#8B5CF6"
            strokeWidth="4.86304"
            strokeLinecap="round"
          />
          <path
            d="M60.5967 156.743L116.489 144.863"
            stroke="#8B5CF6"
            strokeWidth="4.86304"
            strokeLinecap="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_floating_card_a">
            <rect
              width="170.207"
              height="194.522"
              fill="white"
              transform="translate(0 35.3879) rotate(-12)"
            />
          </clipPath>
        </defs>
      </svg>
    </motion.div>
  );
}

/** Checklist-style card, +12° rotation */
export function FloatingCardB() {
  return (
    <motion.div
      className="shrink-0"
      animate={floatB}
      aria-hidden
    >
      <svg
        width="207"
        height="226"
        viewBox="0 0 207 226"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[180px] w-auto md:h-[226px] md:w-[207px]"
      >
        <g clipPath="url(#clip0_floating_card_b)">
          <path
            d="M169.232 37.3183L69.3402 16.0856C64.086 14.9688 58.9213 18.3228 57.8045 23.577L28.9886 159.145C27.8718 164.399 31.2258 169.564 36.48 170.681L136.372 191.914C141.626 193.03 146.791 189.676 147.908 184.422L176.724 48.8541C177.841 43.5999 174.487 38.4352 169.232 37.3183Z"
            fill="#191A23"
          />
          <path
            d="M165.487 31.5505L65.5946 10.3177C60.3404 9.20092 55.1757 12.5549 54.0589 17.8091L25.243 153.377C24.1262 158.631 27.4802 163.796 32.7344 164.913L132.627 186.146C137.881 187.262 143.046 183.908 144.162 178.654L172.978 43.0862C174.095 37.832 170.741 32.6673 165.487 31.5505Z"
            fill="white"
            stroke="#191A23"
            strokeWidth="4.86304"
          />
          <path
            d="M83.1338 38.9042L71.2419 36.3765C69.2716 35.9577 67.3348 37.2155 66.916 39.1858L64.3883 51.0777C63.9695 53.0481 65.2272 54.9848 67.1976 55.4036L79.0895 57.9313C81.0598 58.3502 82.9966 57.0924 83.4154 55.1221L85.9431 43.2301C86.3619 41.2598 85.1042 39.3231 83.1338 38.9042Z"
            fill="#8B5CF6"
            stroke="#191A23"
            strokeWidth="2.43152"
          />
          <path
            d="M70.409 46.1429L73.2183 50.4688L84.754 42.9774"
            stroke="white"
            strokeWidth="3.64728"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M94.1929 51.1983L151.274 63.3313"
            stroke="#191A23"
            strokeWidth="3.64728"
            strokeLinecap="round"
          />
          <path
            d="M76.0562 72.2017L64.1643 69.674C62.1939 69.2552 60.2572 70.5129 59.8384 72.4832L57.3107 84.3752C56.8919 86.3455 58.1496 88.2823 60.1199 88.7011L72.0119 91.2288C73.9822 91.6476 75.919 90.3898 76.3378 88.4195L78.8655 76.5276C79.2843 74.5572 78.0265 72.6205 76.0562 72.2017Z"
            fill="#8B5CF6"
            stroke="#191A23"
            strokeWidth="2.43152"
          />
          <path
            d="M63.3314 79.4403L66.1406 83.7662L77.6763 76.2748"
            stroke="white"
            strokeWidth="3.64728"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M87.1152 84.4957L144.197 96.6287"
            stroke="#191A23"
            strokeWidth="3.64728"
            strokeLinecap="round"
          />
          <path
            d="M68.9786 105.499L57.0866 102.971C55.1163 102.553 53.1795 103.81 52.7607 105.781L50.233 117.673C49.8142 119.643 51.072 121.58 53.0423 121.998L64.9342 124.526C66.9045 124.945 68.8413 123.687 69.2601 121.717L71.7878 109.825C72.2066 107.855 70.9489 105.918 68.9786 105.499Z"
            fill="white"
            stroke="#191A23"
            strokeWidth="2.43152"
          />
          <path
            d="M80.0376 117.793L137.119 129.926"
            stroke="#191A23"
            strokeWidth="3.64728"
            strokeLinecap="round"
          />
          <path
            d="M122.55 151.688L58.3334 138.038C54.3928 137.201 50.5192 139.716 49.6816 143.657L48.165 150.792C47.3274 154.733 49.8429 158.606 53.7835 159.444L118 173.093C121.941 173.931 125.814 171.415 126.652 167.475L128.168 160.34C129.006 156.399 126.491 152.525 122.55 151.688Z"
            fill="#8B5CF6"
            stroke="#191A23"
            strokeWidth="3.64728"
          />
        </g>
        <defs>
          <clipPath id="clip0_floating_card_b">
            <rect
              width="170.207"
              height="194.522"
              fill="white"
              transform="translate(40.4434) rotate(12)"
            />
          </clipPath>
        </defs>
      </svg>
    </motion.div>
  );
}
