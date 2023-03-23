# license-similarity

This package tries to identify an SPDX license from provided license text by matching the provided file's contents with the SPDX database of licenses. It's essentially a fork of https://github.com/spdx/spdx-license-matcher (Python) implemented in TypeScript and without the need for installing locally and running Redis.


<div id="top"></div>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<h3 align="center">license-similarity</h3>
<p align="center">Detecting SPDX licenses from license text.</p>
<p>
    <a href="https://github.com/lkoskela/license-similarity"><strong>Explore the docs »</strong></a>
    ·
    <a href="https://github.com/lkoskela/license-similarity/issues">Report Bug</a>
    ·
    <a href="https://github.com/lkoskela/license-similarity/issues">Request Feature</a>
</p>


<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation-for-programmatic-use">Installation for programmatic use</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#programmatic-usage">Programmatic usage</a></li>
      </ul>
    </li>
    <!--
    <li><a href="#roadmap">Roadmap</a></li>
    -->
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>
<!--
-->


<!-- ABOUT THE PROJECT -->
## About The Project

![Command-line usage][product-screenshot]

The SPDX syntax for expressing license terms comes from the [Software Package Data eXchange (SPDX)](https://spdx.org/), a standard from the [Linux Foundation](https://www.linuxfoundation.org/) for shareable data about software package license terms. SPDX aims to make sharing and auditing license data easy, especially for users of open-source software.

Many dependency management systems allow library developers to unambiguously identify which license their work is distributed with by attaching the appropriate SPDX identifier to their package's metadata. Many developers don't do that, however, and instead refer to the license within spans of freeform text, substitute the full license text instead of an SPDX identifier, or simply include a file such as `LICENSE.txt` in their source code repository or distribution archive.

The objective of `license-similarity` is to support building automation tools that deal with license information in bulk or otherwise without ability to correct sloppy or outright invalid license expressions one by one, for example, when processing hundreds or thousands of direct and transitive dependencies of as part of a software audit, by applying similarity algorithms suitable for detecting a set of standard SPDX licenses based on license text extracted from sources such as a `LICENSE.txt` or source code header comments.

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- GETTING STARTED -->
## Getting Started

### Installation for command line use

**With a global install from the NPM registry:**

1. Install the NPM package globally
   ```sh
   $ npm install -g license-similarity
   ```

**By cloning the Git repository and installing locally:**

1. Clone the repo
   ```sh
   $ git clone https://github.com/lkoskela/license-similarity.git
   ```
2. Install NPM packages
   ```sh
   $ npm install
   ```
3. Link the CLI entrypoint to your PATH
   ```sh
   $ npm link
   ```

<p align="right">(<a href="#top">back to top</a>)</p>

### Installation for programmatic use

1. Install the `license-similarity` package as a dependency
   ```sh
   $ npm install --save license-similarity
   ```
2. Import the parse function in your code...
   ```js
   const identifyLicense = require('license-similarity')
   ```
3. ...or import the whole set:
   ```js
   import { identifyLicense } from 'license-similarity'
   ```

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->

## Usage

### Command line usage

After installing for command-line use, run the `identifylicense` command and point it to a license file to analyze.

The `identifylicense` command will either print out the matching license's SPDX identifier, or a JSON array of the closest matches in the SPDX database depending on whether you want one (best) match or multiple.

If the provided license text is not a close enough match to any of our known licenses, the command produces either no output or an empty array.

Identifying the single best match for a license text:
   ```sh
   $ identifylicense path/to/LICENSE.txt
   # => MIT

   $ identifylicense src/main/java/com/acme/Foo.java
   # => Apache-2.0

   $ identifylicense src/main/java/com/acme/Bar.java
   # => (no output)
  ```

Listing best matches along with a confidence score:
  ```sh
   $ identifylicense -a LICENSE.txt
   # =>
   # [
   #   {
   #     "licenseId": "BSD-2-Clause",
   #     "score": 1
   #   },
   #   {
   #     "licenseId": "BSD-2-Clause-NetBSD",
   #     "score": 0.9404761904761905
   #   },
   #   {
   #     "licenseId": "BSD-1-Clause",
   #     "score": 0.9281045751633987
   #   },
   #   {
   #     "licenseId": "BSD-2-Clause-Views",
   #     "score": 0.9235127478753541
   #   },
   #   {
   #     "licenseId": "BSD-3-Clause",
   #     "score": 0.9204545454545454
   #   }
   # ]

   $ identifylicense -a README.txt
   # =>
   # []
  ```

The CLI also supports reading the license file from standard input:

   ```sh
   $ cat ../project/LICENSE.txt | identifylicense
   # => MIT
  ```

### Programmatic usage

Identifying an SPDX license from a license text:

   ```js
   import { identifyLicense } from 'license-similarity'

   const simple = identifyLicense(
       "Copyright (C) YEAR by AUTHOR EMAIL\n" +
       "\n" +
       "Permission to use, copy, modify, and/or distribute this software for any\n" +
       "purpose with or without fee is hereby granted.\n" +
       "\n" +
       "THE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES\n" +
       "WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY\n" +
       "AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,\n" +
       "INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS\n" +
       "OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER\n" +
       "TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF\n" +
       "THIS SOFTWARE.\n"
   )
   // => { license: '0BSD' }
   ```

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- ROADMAP -->
## Roadmap

There is currently not much of a roadmap.

The original idea was to reach functional parity with the Python implementation, [spdx-license-matcher](https://github.com/spdx/spdx-license-matcher). This has been accomplished already to the degree that we identify licenses with similar accuracy. The underlying implementation approach is very different, though.

See the [open issues](https://github.com/lkoskela/license-similarity/issues) for a full and up to date list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement". Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Once you feel good about the contribution, its tests all pass (`npm test`) and test coverage looks good, go ahead and open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See [LICENSE][license-url] for more information.

The Linux Foundation and its contributors license the SPDX standard under the terms of [the Creative Commons Attribution License 3.0 Unported (SPDX: "CC-BY-3.0")](http://spdx.org/licenses/CC-BY-3.0). "SPDX" is a United States federally registered trademark of the [Linux Foundation](https://www.linuxfoundation.org/). The authors of this package license their work under the terms of the [MIT License](https://spdx.org/licenses/MIT.html).

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Lasse Koskela - [@lassekoskela](https://twitter.com/lassekoskela) on Twitter or the same at gmail.com

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Othneil Drew](https://github.com/othneildrew) for the [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/lkoskela/license-similarity.svg?style=for-the-badge
[contributors-url]: https://github.com/lkoskela/license-similarity/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/lkoskela/license-similarity.svg?style=for-the-badge
[forks-url]: https://github.com/lkoskela/license-similarity/network/members
[stars-shield]: https://img.shields.io/github/stars/lkoskela/license-similarity.svg?style=for-the-badge
[stars-url]: https://github.com/lkoskela/license-similarity/stargazers
[issues-shield]: https://img.shields.io/github/issues/lkoskela/license-similarity.svg?style=for-the-badge
[issues-url]: https://github.com/lkoskela/license-similarity/issues
[license-shield]: https://img.shields.io/github/license/lkoskela/license-similarity.svg?style=for-the-badge
[license-url]: https://github.com/lkoskela/license-similarity/blob/master/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/lassekoskela
[product-screenshot]: images/screenshot.png
