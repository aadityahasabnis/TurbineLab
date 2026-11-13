// IAPWS-IF97 Regions 1, 2 and 4, implemented from the official release equations.
// This module intentionally excludes Region 3; callers must check applicability.
const R = 0.461526; // kJ/(kg K)
export const IF97_LIMITS = Object.freeze({ minPressureMPa: 0.000611213, maxSaturationPressureMPa: 16.5292, minTemperatureK: 273.15, maxTemperatureK: 1073.15 });

const R1_N = [0.14632971213167,-0.84548187169114,-3.756360367204,3.3855169168385,-0.95791963387872,0.15772038513228,-0.016616417199501,8.1214629983568e-4,2.8319080123804e-4,-6.0706301565874e-4,-0.018990068218419,-0.032529748770505,-0.021841717175414,-5.283835796993e-5,-4.7184321073267e-4,-3.0001780793026e-4,4.7661393906987e-5,-4.4141845330846e-6,-7.2694996297594e-16,-3.1679644845054e-5,-2.8270797985312e-6,-8.5205128120103e-10,-2.2425281908e-6,-6.5171222895601e-7,-1.4341729937924e-13,-4.0516996860117e-7,-1.2734301741641e-9,-1.7424871230634e-10,-6.8762131295531e-19,1.4478307828521e-20,2.6335781662795e-23,-1.1947622640071e-23,1.8228094581404e-24,-9.3537087292458e-26];
const R1_I = [0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,3,3,3,4,4,4,5,8,8,21,23,29,30,31,32];
const R1_J = [-2,-1,0,1,2,3,4,5,-9,-7,-1,0,1,3,-3,0,1,3,17,-4,0,6,-5,-2,10,-8,-11,-6,-29,-31,-38,-39,-40,-41];
const R2_IDEAL_N = [-9.6927686500217,10.086655968018,-0.005608791128302,0.071452738081455,-0.40710498223928,1.4240819171444,-4.383951131945,-0.28408632460772,0.021268463753307];
const R2_IDEAL_J = [0,1,-5,-4,-3,-2,-1,2,3];
const R2_N = [-1.7731742473213e-3,-0.017834862292358,-0.045996013696365,-0.057581259083432,-0.05032527872793,-3.3032641670203e-5,-1.8948987516315e-4,-3.9392777243355e-3,-0.043797295650573,-2.6674547914087e-5,2.0481737692309e-8,4.3870667284435e-7,-3.227767723857e-5,-1.5033924542148e-3,-0.040668253562649,-7.8847309559367e-10,1.2790717852285e-8,4.8225372718507e-7,2.2922076337661e-6,-1.6714766451061e-11,-2.1171472321355e-3,-23.895741934104,-5.905956432427e-18,-1.2621808899101e-6,-0.038946842435739,1.1256211360459e-11,-8.2311340897998,1.9809712802088e-8,1.0406965210174e-19,-1.0234747095929e-13,-1.0018179379511e-9,-8.0882908646985e-11,0.10693031879409,-0.33662250574171,8.9185845355421e-25,3.0629316876232e-13,-4.2002467698208e-6,-5.9056029685639e-26,3.7826947613457e-6,-1.2768608934681e-15,7.3087610595061e-29,5.5414715350778e-17,-9.436970724121e-7];
const R2_I = [1,1,1,1,1,2,2,2,2,2,3,3,3,3,3,4,4,4,5,6,6,6,7,7,7,8,8,9,10,10,10,16,16,18,20,20,20,21,22,23,24,24,24];
const R2_J = [0,1,2,3,6,1,2,4,7,36,0,1,3,6,35,1,2,3,7,3,16,35,0,11,25,8,36,13,4,10,14,29,50,57,20,35,48,21,53,39,26,40,58];

function propertiesFromGibbs(pMPa, tK, region) {
  const pi = region === 1 ? pMPa / 16.53 : pMPa;
  const tau = (region === 1 ? 1386 : 540) / tK;
  let g, gp = 0, gt = 0, gtt = 0;
  if (region === 1) {
    const x = 7.1 - pi, y = tau - 1.222;
    g = 0;
    for (let k = 0; k < R1_N.length; k++) {
      const { n, i, j } = { n: R1_N[k], i: R1_I[k], j: R1_J[k] };
      g += n * x ** i * y ** j;
      gp -= n * i * x ** (i - 1) * y ** j;
      gt += n * x ** i * j * y ** (j - 1);
      gtt += n * x ** i * j * (j - 1) * y ** (j - 2);
    }
    return { p: pMPa, t: tK, h: R * tK * tau * gt, s: R * (tau * gt - g), v: R * tK * pi * gp / (1000 * pMPa), region };
  }

  let gi = Math.log(pi), gip = 1 / pi, git = 0, gitt = 0;
  for (let k = 0; k < R2_IDEAL_N.length; k++) {
    const n = R2_IDEAL_N[k], j = R2_IDEAL_J[k];
    gi += n * tau ** j;
    git += n * j * tau ** (j - 1);
    gitt += n * j * (j - 1) * tau ** (j - 2);
  }
  let gr = 0, grp = 0, grt = 0, grtt = 0;
  for (let k = 0; k < R2_N.length; k++) {
    const n = R2_N[k], i = R2_I[k], j = R2_J[k], x = tau - 0.5;
    gr += n * pi ** i * x ** j;
    grp += n * i * pi ** (i - 1) * x ** j;
    grt += n * pi ** i * j * x ** (j - 1);
    grtt += n * pi ** i * j * (j - 1) * x ** (j - 2);
  }
  g = gi + gr; gp = gip + grp; gt = git + grt; gtt = gitt + grtt;
  return { p: pMPa, t: tK, h: R * tK * tau * gt, s: R * (tau * gt - g), v: R * tK * pi * gp / (1000 * pMPa), region };
}

export function saturationTemperatureK(pMPa) {
  if (!(pMPa >= 0.000611213 && pMPa <= 22.064)) throw new RangeError("Pressure is outside the IAPWS-IF97 saturation range.");
  const n = [1167.0521452767,-724213.16703206,-17.073846940092,12020.82470247,-3232555.0322333,14.91510861353,-4823.2657361591,405113.40542057,-0.238558557567849,650.17534844798];
  const b = pMPa ** 0.25;
  const e = b * b + n[2] * b + n[5];
  const f = n[0] * b * b + n[3] * b + n[6];
  const g = n[1] * b * b + n[4] * b + n[7];
  const d = 2 * g / (-f - Math.sqrt(f * f - 4 * e * g));
  return (n[9] + d - Math.sqrt((n[9] + d) ** 2 - 4 * (n[8] + n[9] * d))) / 2;
}

export function saturationPressureMPa(tK) {
  if (!(tK >= 273.15 && tK <= 647.096)) throw new RangeError("Temperature is outside the IAPWS-IF97 saturation range.");
  const v = tK - 0.238558557567849 / (tK - 650.17534844798);
  const a = v * v + 1167.0521452767 * v - 724213.16703206;
  const b = -17.073846940092 * v * v + 12020.82470247 * v - 3232555.0322333;
  const c = 14.91510861353 * v * v - 4823.2657361591 * v + 405113.40542057;
  return (2 * c / (-b + Math.sqrt(b * b - 4 * a * c))) ** 4;
}

export function region1(pMPa, tK) {
  if (!(pMPa > 0 && pMPa <= 100 && tK >= 273.15 && tK <= 623.15 && pMPa * (1 + 1e-10) >= saturationPressureMPa(tK))) throw new RangeError("State is outside the stable IAPWS-IF97 Region 1 domain.");
  return propertiesFromGibbs(pMPa, tK, 1);
}

function boundary23Pressure(tK) {
  return 348.05185628969 - 1.1671859879975 * tK + 0.0010192970039326 * tK * tK;
}

export function region2(pMPa, tK) {
  const upperPressure = tK <= 623.15 ? saturationPressureMPa(tK) : tK <= 863.15 ? boundary23Pressure(tK) : 100;
  if (!(pMPa > 0 && pMPa <= upperPressure * (1 + 1e-10) && tK >= 273.15 && tK <= 1073.15)) throw new RangeError("State is outside the stable IAPWS-IF97 Region 2 domain.");
  return propertiesFromGibbs(pMPa, tK, 2);
}

export function saturatedProperties(pMPa) {
  if (!(pMPa > 0 && pMPa <= IF97_LIMITS.maxSaturationPressureMPa)) throw new RangeError("Saturated properties require Region 1/2 coverage (p ≤ 16.5292 MPa).");
  const tK = saturationTemperatureK(pMPa);
  return { tK, liquid: region1(pMPa, tK), vapor: region2(pMPa, tK) };
}
