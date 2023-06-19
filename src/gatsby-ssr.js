import React from 'react';

const getOptions = (pluginOptions) => {
  const plausibleDomain = pluginOptions.customDomain || 'plausible.io';
  const scriptURI =
    plausibleDomain === 'plausible.io' ? '/js/plausible.js' : '/js/index.js';
  const domain = pluginOptions.domain || false;
  const proxyScript = pluginOptions.proxyScript || false;
  const proxyApi = pluginOptions.proxyApi || false;
  const excludePaths = pluginOptions.excludePaths || [];
  const trackAcquisition = pluginOptions.trackAcquisition || false;

  return {
    plausibleDomain,
    scriptURI,
    domain,
    proxyScript,
    proxyApi,
    excludePaths,
    trackAcquisition,
  };
};

exports.onRenderBody = ({ setHeadComponents }, pluginOptions) => {
  if (process.env.NODE_ENV === 'production') {
    const {
      plausibleDomain,
      scriptURI,
      domain,
      proxyScript,
      proxyApi,
      excludePaths,
      trackAcquisition,
    } = getOptions(pluginOptions);

    const plausibleExcludePaths = [];
    const Minimatch = require(`minimatch`).Minimatch;
    excludePaths.map((exclude) => {
      const mm = new Minimatch(exclude);
      plausibleExcludePaths.push(mm.makeRe());
    });
    const scriptProps = {
      async: true,
      defer: true,
      'data-domain': domain,
      src: proxyScript || `https://${plausibleDomain}${scriptURI}`,
    };
    if (trackAcquisition) {
      scriptProps['data-track-acquisition'] = true;
    }
    if (proxyApi) {
      scriptProps['data-api'] = proxyApi;
    }

    return setHeadComponents([
      proxyScript ? null : (
        <link
          key="gatsby-plugin-plausible-preconnect"
          rel="preconnect"
          href={`https://${plausibleDomain}`}
        />
      ),
      <script key="gatsby-plugin-plausible-script" {...scriptProps}></script>,
      //See: https://docs.plausible.io/goals-and-conversions#trigger-custom-events-with-javascript
      <script
        key="gatsby-plugin-plausible-custom-events"
        dangerouslySetInnerHTML={{
          __html: `
          window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) };
          ${
            excludePaths.length
              ? `window.plausibleExcludePaths=[${excludePaths.join(`,`)}];`
              : ``
          }
          `,
        }}
      />,
    ]);
  }
  return null;
};
