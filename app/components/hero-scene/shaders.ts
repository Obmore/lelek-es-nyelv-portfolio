// Soft pearl sphere: simplex-noise surface breathing, wrapped diffuse, fresnel iridescence and a warm coral rim.

const noise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

export const sphereVertex = /* glsl */ `
uniform float uTime;
uniform float uAmp;
varying vec3 vN;
varying vec3 vV;
${noise}
float disp(vec3 p){
  return (snoise(p*0.95+vec3(0.0,uTime*0.11,uTime*0.07))*0.7 + snoise(p*2.1-vec3(uTime*0.09))*0.3)*uAmp;
}
void main(){
  vec3 n=normalize(position);
  vec3 t1=normalize(cross(n,abs(n.y)>0.9?vec3(1.0,0.0,0.0):vec3(0.0,1.0,0.0)));
  vec3 t2=cross(n,t1);
  float e=0.02;
  vec3 pa=normalize(n+t1*e);
  vec3 pb=normalize(n+t2*e);
  vec3 d0=n*(1.0+disp(n));
  vec3 da=pa*(1.0+disp(pa));
  vec3 db=pb*(1.0+disp(pb));
  vec3 nn=normalize(cross(da-d0,db-d0));
  if(dot(nn,n)<0.0) nn=-nn;
  vN=normalize(normalMatrix*nn);
  vec4 mv=modelViewMatrix*vec4(d0,1.0);
  vV=-mv.xyz;
  gl_Position=projectionMatrix*mv;
}`;

export const sphereFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uLight;
uniform vec3 uShadow;
uniform vec3 uPeach;
uniform vec3 uCoral;
uniform vec3 uPaper;
varying vec3 vN;
varying vec3 vV;
void main(){
  vec3 N=normalize(vN);
  vec3 V=normalize(vV);
  vec3 L=normalize(vec3(-0.55,0.65,0.6));
  float ndv=clamp(dot(N,V),0.0,1.0);
  float fres=pow(1.0-ndv,2.4);
  float diff=clamp(dot(N,L)*0.5+0.5,0.0,1.0);
  diff=smoothstep(0.1,0.95,diff);
  vec3 col=mix(uShadow,uLight,diff);

  // faint pearl iridescence, desaturated so it stays calm
  float ph=ndv*2.6+N.y*0.9+uTime*0.04;
  vec3 irid=0.5+0.5*cos(6.28318*(vec3(0.0,0.33,0.67)+ph));
  irid=mix(vec3(dot(irid,vec3(0.333))),irid,0.55);
  col=mix(col,col*0.72+irid*0.36,fres*0.85);

  // warm coral rim from the lower right
  float rimDir=smoothstep(-0.3,0.85,dot(N,normalize(vec3(0.8,-0.55,0.25))));
  col+=uCoral*fres*rimDir*0.85;
  col+=uPeach*pow(1.0-ndv,4.0)*0.25;

  // soft sheen
  vec3 R=reflect(-L,N);
  col+=uPaper*pow(max(dot(R,V),0.0),9.0)*0.1;
  gl_FragColor=vec4(col,1.0);
  #include <colorspace_fragment>
}`;
