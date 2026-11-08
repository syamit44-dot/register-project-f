
import Chickatron13Image from "../assets/images/Chickatron 13.png";
import Chickatron20Image from "../assets/images/Chickatron 20.png";
import Pigatron13Image from "../assets/images/Pigatron 13.png";
import Punos207Image from "../assets/images/Punos 207.png";
import Punos515Image from "../assets/images/Punos 515.png";
import R_Tron207Image from "../assets/images/R_Tron 207.png";
import R_Tron313Image from "../assets/images/R_Tron 313.png";
import R_TronImage from "../assets/images/R_Tron.png";
import R_Tron612Image from "../assets/images/R_Tron 612.png";
import Temp1200PlusImage from "../assets/images/Temp_1200_Plus.png";
import TP54SImage from "../assets/images/TP54S.png";
import TP80Image from "../assets/images/TP80.png";

// ข้อมูล model แต่ละรุ่น: ชื่อ, รหัส,  SVG illustration (ใช้ dangerouslySetInnerHTML)
const modelData = {
  "Chickatron 20": {
    name: "Chickatron 20",
    code: "Chickatron 20",
    svg: `<img src="${Chickatron20Image}" alt="Chickatron 20" class="product-svg" />`,
  },
  "Chickatron Layers": {
    name: "Chickatron Layers",
    code: "Chickatron Layers",
    svg: `<img src="${Chickatron20Image}" alt="Chickatron 20" class="product-svg" />`,
  },
  "Chickatron 13": {
    name: "Chickatron 13",
    code: "Chickatron 13",
    svg: `<img src="${Chickatron13Image}" alt="Chickatron 13" class="product-svg" />`
  },
  "Pigatron 13": {
    name: "Pigatron 13",
    code: "Pigatron 13",
    svg: `<img src="${Pigatron13Image}" alt="Pigatron 13" class="product-svg" />`
  },
  "Temp 1200 plus": {
    name: "Temp 1200 plus",
    code: "Temp 1200 plus",
    svg: `<img src="${Temp1200PlusImage}" alt="Temp 1200 Plus" class="product-svg" />`
  },
  "R-Tron": {
    name: "R-Tron",
    code: "R-Tron",
    svg: `<img src="${R_TronImage}" alt="R-Tron" class="product-svg" />`
  },
  "R-Tron 207": {
    name: "R-Tron 207",
    code: "R-Tron 207",
    svg: `<img src="${R_Tron207Image}" alt="R_Tron 207" class="product-svg" />`
  },
  "R-Tron 313": {
    name: "R-Tron 313",
    code: "R-Tron 313",
    svg: `<img src="${R_Tron313Image}" alt="R_Tron 313" class="product-svg" />`
  },
  "R-Tron 612": {
    name: "R-Tron 612",
    code: "R-Tron 612",
    svg: `<img src="${R_Tron612Image}" alt="R_Tron 612" class="product-svg" />`
  },
    "R-Tron 612 Pig": {
    name: "R-Tron 612 Pig",
    code: "R-Tron 612 Pig",
    svg: `<img src="${R_Tron612Image}" alt="R_Tron 612 Pig" class="product-svg" />`
  },
    "R-Tron 620": {
    name: "R-Tron 620",
    code: "R-Tron 620",
    svg: `<img src="${R_TronImage}" alt="R_Tron 620" class="product-svg" />`
  },
    "R-Tron 620 Pig": {
    name: "R-Tron 620 Pig",
    code: "R-Tron 620 Pig",
    svg: `<img src="${R_TronImage}" alt="R_Tron 620 Pig" class="product-svg" />`
  },
    "TP 54 S": {
    name: "TP 54 S",
    code: "TP 54 S",
    svg: `<img src="${TP54SImage}" alt="TP 54 S" class="product-svg" />`
  },
      "TP 80": {
    name: "TP 80",
    code: "TP 80",
    svg: `<img src="${TP80Image}" alt="T 80" class="product-svg" />`
  },
      "Punos 207": {
    name: "Punos 207",
    code: "Punos 207",
    svg: `<img src="${Punos207Image}" alt="Punos 207" class="product-svg" />`
  },
      "Punos 515": {
    name: "Punos 515",
    code: "Punos 515",
    svg: `<img src="${Punos515Image}" alt="Punos 515" class="product-svg" />`
  },
};
export default modelData;