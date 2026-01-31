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

const EMERALD = "#10B981";

/** Resume-style card, -12° rotation, emerald accent */
export function CareersFloatingCardA() {
  return (
    <motion.div
      className="shrink-0 opacity-30"
      animate={floatA}
      aria-hidden
    >
      <div className="origin-top-left -rotate-12 overflow-hidden">
        <svg
          width="213"
          height="241"
          viewBox="0 0 213 241"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[180px] w-auto md:h-[208px] md:w-[185px]"
        >
          <g clipPath="url(#clip0_careers_a)">
            <path
              d="M134.456 17.3055L33.3436 38.7976C28.0253 39.9281 24.6303 45.1559 25.7607 50.4743L60.0458 211.773C61.1762 217.091 66.404 220.486 71.7224 219.356L172.835 197.864C178.153 196.733 181.548 191.505 180.418 186.187L146.133 24.8884C145.002 19.57 139.774 16.1751 134.456 17.3055Z"
              fill="#191A23"
            />
            <path
              d="M128.618 13.5141L27.5052 35.0062C22.1869 36.1366 18.7919 41.3644 19.9224 46.6828L54.2074 207.981C55.3379 213.3 60.5657 216.695 65.884 215.564L166.997 194.072C172.315 192.942 175.71 187.714 174.579 182.395L140.294 21.097C139.164 15.7786 133.936 12.3836 128.618 13.5141Z"
              fill="white"
              stroke="#191A23"
              strokeWidth="4.92245"
            />
            <path
              d="M89.3193 77.2238C99.956 74.9629 106.746 64.5073 104.485 53.8705C102.224 43.2338 91.7686 36.4439 81.1318 38.7048C70.4951 40.9657 63.7051 51.4213 65.9661 62.058C68.227 72.6948 78.6826 79.4847 89.3193 77.2238Z"
              fill={EMERALD}
              stroke="#191A23"
              strokeWidth="3.69183"
            />
            <path
              d="M62.9885 95.4016L120.767 83.1204"
              stroke="#191A23"
              strokeWidth="4.92245"
              strokeLinecap="round"
            />
            <path
              d="M75.177 105.392L113.696 97.2045"
              stroke="#191A23"
              strokeWidth="2.46122"
              strokeLinecap="round"
            />
            <path
              d="M56.2197 134.584L142.888 116.162"
              stroke={EMERALD}
              strokeWidth="4.92245"
              strokeLinecap="round"
            />
            <path
              d="M59.8018 151.436L128.414 136.852"
              stroke="#191A23"
              strokeWidth="2.46122"
              strokeLinecap="round"
            />
            <path
              d="M62.3604 163.473L149.028 145.051"
              stroke="#191A23"
              strokeWidth="2.46122"
              strokeLinecap="round"
            />
            <path
              d="M66.9658 185.14L153.634 166.718"
              stroke={EMERALD}
              strokeWidth="4.92245"
              strokeLinecap="round"
            />
            <path
              d="M153.785 179.267L71.9319 196.665C70.6023 196.948 69.7535 198.255 70.0361 199.584L71.0596 204.399C71.3422 205.729 72.6491 206.578 73.9787 206.295L155.832 188.897C157.161 188.614 158.01 187.307 157.727 185.977L156.704 181.163C156.421 179.833 155.114 178.984 153.785 179.267Z"
              fill={EMERALD}
              stroke="#191A23"
              strokeWidth="2.46122"
            />
          </g>
          <defs>
            <clipPath id="clip0_careers_a">
              <rect
                width="172.286"
                height="209.204"
                fill="white"
                transform="translate(0 35.8202) rotate(-12)"
              />
            </clipPath>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
}

/** Resume-style card with check, +12° rotation, emerald accent */
export function CareersFloatingCardB() {
  return (
    <motion.div
      className="shrink-0 opacity-30"
      animate={floatB}
      aria-hidden
    >
      <div className="origin-top-left rotate-12 overflow-hidden">
        <svg
          width="213"
          height="241"
          viewBox="0 0 213 241"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[180px] w-auto md:h-[208px] md:w-[185px]"
        >
          <g clipPath="url(#clip0_careers_b)">
            <path
              d="M173.858 37.7742L72.7458 16.2821C67.4275 15.1516 62.1997 18.5466 61.0692 23.865L26.7842 185.163C25.6537 190.482 29.0487 195.71 34.367 196.84L135.48 218.332C140.798 219.463 146.026 216.068 147.156 210.749L181.441 49.4508C182.572 44.1324 179.177 38.9046 173.858 37.7742Z"
              fill="#191A23"
            />
            <path
              d="M170.067 31.9359L68.9543 10.4438C63.636 9.31333 58.4082 12.7083 57.2777 18.0267L22.9927 179.325C21.8622 184.644 25.2572 189.871 30.5755 191.002L131.688 212.494C137.006 213.624 142.234 210.229 143.365 204.911L177.65 43.6125C178.78 38.2942 175.385 33.0664 170.067 31.9359Z"
              fill="white"
              stroke="#191A23"
              strokeWidth="4.92245"
            />
            <path
              d="M102.112 103.043C116.738 106.152 131.114 96.8154 134.223 82.1898C137.332 67.5643 127.995 53.1879 113.37 50.0791C98.7444 46.9704 84.3679 56.3065 81.2592 70.9321C78.1504 85.5576 87.4866 99.934 102.112 103.043Z"
              fill={EMERALD}
              stroke="#191A23"
              strokeWidth="3.69183"
            />
            <path
              d="M93.2965 73.4906L100.879 85.1673L124.233 70.0015"
              stroke="white"
              strokeWidth="6.15306"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M54.173 115.499L140.841 133.921"
              stroke="#191A23"
              strokeWidth="3.69183"
              strokeLinecap="round"
            />
            <path
              d="M50.3351 133.555L124.966 149.418"
              stroke="#191A23"
              strokeWidth="3.69183"
              strokeLinecap="round"
            />
            <path
              d="M46.4972 151.61L133.165 170.032"
              stroke="#191A23"
              strokeWidth="3.69183"
              strokeLinecap="round"
            />
            <path
              d="M111.271 184.25L60.7151 173.504C55.3967 172.374 50.1689 175.769 49.0384 181.087C47.908 186.405 51.303 191.633 56.6213 192.764L107.178 203.51C112.496 204.64 117.724 201.245 118.854 195.927C119.985 190.608 116.59 185.381 111.271 184.25Z"
              fill={EMERALD}
              stroke="#191A23"
              strokeWidth="3.69183"
            />
            <path
              d="M62.4595 188.972C65.1187 189.537 67.7326 187.84 68.2978 185.181C68.8631 182.522 67.1656 179.908 64.5064 179.342C61.8472 178.777 59.2333 180.475 58.6681 183.134C58.1029 185.793 59.8003 188.407 62.4595 188.972Z"
              fill="white"
            />
          </g>
          <defs>
            <clipPath id="clip0_careers_b">
              <rect
                width="172.286"
                height="209.204"
                fill="white"
                transform="translate(43.496) rotate(12)"
              />
            </clipPath>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
}
