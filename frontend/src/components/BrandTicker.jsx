import OMP from '../assets/brands/OMP.png'
import BELL from '../assets/brands/BELL.png'
import STILO from '../assets/brands/STILO.png'
import EVOCORSE from '../assets/brands/EVOCORSE.png'
import ORECA from '../assets/brands/ORECA.png'
import ENDLESS from '../assets/brands/ENDLESS.png'
import LIFELINE from '../assets/brands/LIFELINE.png'
import FASTIME from '../assets/brands/FASTIME.png'

const logos = [
  OMP,
  BELL,
  STILO,
  EVOCORSE,
  ORECA,
  ENDLESS,
  LIFELINE,
  FASTIME,
]

export default function BrandTicker() {
  return (
    <div className="brand-ticker">
      <div className="brand-track">
        {[...logos, ...logos].map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt="brand"
            className="brand-logo"
          />
        ))}
      </div>
    </div>
  )
}