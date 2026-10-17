// Shared three.js helpers for the site's real-time 3D pieces (size-guide tags, About seals and envelope).

// Contact-hardening soft shadows (PCSS): shadows stay crisp where the tags nearly touch the wall and soften as the
// gap grows, like light from a real softbox. Patched into three.js's basic shadow lookup: find the average depth of
// nearby occluders, size the penumbra from the occluder-to-receiver distance, then filter with a rotated Vogel disk.
export function installPCSS(THREE: typeof import("three")) {
  const chunk = THREE.ShaderChunk;
  const pcss = /* glsl */ `
    #define PCSS_SAMPLES 20
    float pcssNoise( vec2 p ) { return fract( 52.9829189 * fract( dot( p, vec2( 0.06711056, 0.00583715 ) ) ) ); }
    vec2 pcssDisk( int i, int n, float phi ) {
      float r = sqrt( ( float( i ) + 0.5 ) / float( n ) );
      float t = float( i ) * 2.399963229728653 + phi;
      return vec2( cos( t ), sin( t ) ) * r;
    }
    float lustedPCSS( sampler2D map, vec2 mapSize, vec2 uv, float z ) {
      float phi = pcssNoise( gl_FragCoord.xy ) * 6.2831853;
      float texel = 1.0 / mapSize.x;
      float search = 14.0 * texel;
      float blockers = 0.0, sum = 0.0;
      for ( int i = 0; i < PCSS_SAMPLES; i ++ ) {
        float d = texture2D( map, uv + pcssDisk( i, PCSS_SAMPLES, phi ) * search ).r;
        if ( d < z ) { sum += d; blockers += 1.0; }
      }
      if ( blockers < 0.5 ) return 1.0;
      float gap = z - sum / blockers;
      float radius = clamp( gap * 0.55, 1.5 * texel, 20.0 * texel );
      float lit = 0.0;
      for ( int i = 0; i < PCSS_SAMPLES; i ++ ) {
        lit += step( z, texture2D( map, uv + pcssDisk( i, PCSS_SAMPLES, phi + 1.7 ) * radius ).r );
      }
      return lit / float( PCSS_SAMPLES );
    }
  `;
  // (the published build strips GLSL comments, so anchor on code, not comments; skip if already patched by HMR)
  let src = chunk.shadowmap_pars_fragment;
  if (src.includes("lustedPCSS")) return;
  src = src.replace("#ifdef USE_SHADOWMAP", "#ifdef USE_SHADOWMAP\n" + pcss);
  src = src.replace(
    "float depth = texture2D( shadowMap, shadowCoord.xy ).r;",
    "float depth = lustedPCSS( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z );",
  );
  src = src.replace(
    "shadow = step( shadowCoord.z, depth );",
    "shadow = depth;",
  );
  chunk.shadowmap_pars_fragment = src;
}
