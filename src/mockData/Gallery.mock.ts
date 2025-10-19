import comp1 from "../../public/comp-1.jpeg";
import comp2 from "../../public/comp-2.jpeg";
import compHariErik from "../../public/comp-hari-erik.jpeg";
import HariToro from "../../public/Hari-Toro.jpg";
import pandemia from "../../public/pandemia.jpeg";
import posada from "../../public/posada-tavros.png";
import tequila from "../../public/tequila-tavros.jpeg";
import vinoTavros from "../../public/vinos-tavros.jpeg";

export interface GalleryInterface {
  id: number;
  image: string | any;
  description: string;
}

export const ImageGallery: GalleryInterface[] = [
  {
    id: 1,
    image: comp1,
    description: "Competencia Tavros — pura energía y pasión por el deporte.",
  },
  {
    id: 2,
    image: comp2,
    description: "Dándolo todo en la segunda competencia Tavros.",
  },
  {
    id: 3,
    image: compHariErik,
    description: "Hari y Erik, una dupla que inspira dentro y fuera del gym.",
  },
  {
    id: 4,
    image: HariToro,
    description: "Hari y Toro, fuerza y amistad en cada entrenamiento.",
  },
  {
    id: 5,
    image: pandemia,
    description: "Ni la pandemia nos detuvo — seguimos entrenando con actitud.",
  },
  {
    id: 6,
    image: tequila,
    description: "Porque después de entrenar, ¡también se celebra!",
  },
  {
    id: 7,
    image: posada,
    description: "Posada Tavros — comunidad, risas y buena energía.",
  },
  {
    id: 8,
    image: vinoTavros,
    description: "Un brindis por los logros, el esfuerzo y la familia Tavros.",
  },
];
