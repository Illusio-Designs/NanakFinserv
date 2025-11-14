import React from "react";
import './faq.css';

const faq = () => {
    return(
        <div className="faq">
            <div className="container">
                <div className="row">
                    <div className="col-lg-6">
                        <div className="faq-img">
                            <h1>Frequently Asked Questions</h1>
                            <svg width="240" height="260" viewBox="0 0 240 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="240" height="260" fill="url(#pattern0_13_10)"/>
                                <defs>
                                    <pattern id="pattern0_13_10" patternContentUnits="objectBoundingBox" width="1" height="1">
                                    <use href="#image0_13_10" transform="scale(0.00398406 0.00357143)"/>
                                    </pattern>
                                    <image id="image0_13_10" width="240" height="260" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPsAAAEYCAYAAACa1YA+AAAXYUlEQVR4Ae2dTbPbNrZF/f9/U4961JnEPei46iXd9ewM4sQ96PRz3XJcGdxXW7pbwqUpiQABEB+LVSpQEomPfc7CAUCKevP8sv35338/+/X07u/PX37+5+W9PmdDARToW4E3qr5gFtz//etfVl/uBPpuKrVHgbkVePMIdHcAX3/9+dQpzC0XrUeBfhU4wW6gH6UM5/s1NDVHgTeK2I8g9/eaywM8ToMCfSrw5t5c3ZCHKbD3aWhqjQJRw3hBz9wdp0GBPhWIhl3AE937NDa1nluBE+wx83bB7mvwc0tH61GgLwUu19nDefmWfUV3Inxfxqa2cytwgT12oY7h/NyOQ+v7U+AEu6qtKL0loofHfP77d0T3/mxOjSdV4BXssXN3gc/8fVLPodndKXCBXTVPie4Cnstx3dmdCk+owDewA/yEXkCTp1DgFexqsWB/+te76Pk7EX4Kf6GRHSvwDexqyx8fPzx/fvtdEvDM4Tv2Bqo+tAKrsBv4cOU9Zh/gh/YZGtepAndhT52/q2PwL+SUBxsKoMDxCtyEXVUTqHuAF/TO4/imUgMUmFuBu7BLGsMaM4xfHsulubmdjNa3ocBD2HMB73m8Og82FECB+gpsgl3VyhHhw2E90Nc3NiXOrcBm2HMCH0I/t/y0HgXqKRAFu6qVK8ILeIb29QxNSSgQDXtu4IEeJ0SBOgokwR4Cr+gsYHO8PGpgPl/H+JQylwLJsFsmgZny09h7nQPDe6tLigL5FNgNu6riiHwP4JTvgD6fockJBbLAHgKfc1jvDsJPxHGngtlQAAXiFcgGu4s2kAY1d3qJ9r/zwEtrTooCWxTIDrsKNfAlonzYeZzAF/Qvry0N5hgUmFWBIrBbzFrQqwO4RHz9eAf4bQJSFLgoUBR2l2Low6hcev/045vfP51HGcBvU5BOrEAV2KWvgVdaGvS1/C/wM+yf2N3nbno12C3z0dC7I9Bjt84dgIf9n16G/59cVVIUGEqB6rBbvVagN/xOX3cC6gCWL36iaxuS9qXAYbBbphB6PcrK0LWaqjNQPa9XAq4jgvPCoDuHYMQQLBrePOY0vfC54VqD94PvLlMRf+aybqSX8j89//Hx/emBoudO7Hz5Uvts4ytwOOyhxAa/9CW7VjuSo+rlDuz1tEYdx7UzCe3Efp8KNAW7JTT0SnuI9kdBWqvc89Tmw+WSJpc27al9pU3CHkp4Af/3fyc/y74WFDOVc3p68CnyewTAWkboty3uNw97KJojijoARZuZ4Gq9rdc1jDP8od3Yb0OBrmAPJQsj/peffwL8TM8UyNGpnME/z/dDm7F/rALdwh7KFi4kaZ+on+dhInvBvw71We0P/fWo/SFgX4p3hv86l2SR71j4Tz9RflnZX9qK9/UUGBL2pXxL+DX3pwOo3wEwvF96Zt33U8C+Jum1A/AI4DzHlEMyDSjbEXihdc0ufFZOgWlhvyfpuSMQ/O4IrunXjx9OowI6hH0dgqP8PTvwXV4FgD1Rz2uH4LvMnF47htvHhB2J93Wez/VnzvNRGp7nY8P8rvt//PL+Wa+wbrqacUTnBfCJzpd4GrAnCjfaaR5anzuBa+eg9yU7Aq/Yj6Zni+0B9hat0lidriOOcyeQ+74GInwdgwN7HZ2HKmUZ/fdej9f5X3/Vvfdcjy/pKMBeUt0J8j6Df14nUITeAz6wl3UYYC+r71S5O+KnDvMZzpd1F2Avq++UuTvap0R5ons5lwH2ctpOnXMq8LqPAeDLuA6wl9GVXPVE4Zf74WMjPLCXcR9gL6Mrub4oIHAVrWOAB/Yy7gPsZXQl10ABwQvsgSAH7QL7QcLPVCywt2FtYG/DDkPXQnfgEdmPNzGwH2+D4WtAZG/DxMDehh2GrgWwt2FeYG/DDsPWQqDH/mpO57DlVwDY82tKjoECsVFdc3tgDwTMuAvsGcUkq9cKCNqUH8cA+2sdc70D9lxKks8rBQSsXjGr8DpWP6IB9ldSZnsD7NmkJKNQgRTQGcKHCubfB/b8mk6fo0BPGb4De1nXAfay+k6Xu0DfE9V1LlsZBYC9jK5T5roHdKJ6eZcB9vIaT1FCDtCJ6mVdBdjL6jtF7ntBZwW+jpsAex2dhy1lL+gM3+u5BrDX03q4knKBzvC9jmsAex2dhyslB+gM3+u6BbDX1XuI0gC9TzMCe592O6zWAj31hhnNz/1i6F7fhMBeX/MuS3Q01x8xGtjU1Hl1KUTHlQb2jo1Xq+qGMxXu8DznVavulHNVANivWrC3ooDgjH0UdAh3uA/oKwJX/AjYK4rdU1EGM/YpMyHc4b7z60mD0eoK7KNZNEN7ckZzdRaAnsEoGbIA9gwijpKFocwVzZ/eveVBFA05B7A3ZIyjqmLIc83NNXznhpmjrHm7XGC/rc0U3xj0cH69d59/Ym3TdYC9TbsUr5Uhz3GDTNg5ON/iDaCAaAWAPVqyvk/445f3z3rlHLILds/PBTtbmwoAe5t2KVIrgSjQw0icY//rx/csxBWxWN5MgT2vnk3m5qF1rlX2sINw3k02nEq9UgDYX8kx1huDWAJyr7arDLY+FAD2PuwUVcuSkCuqO/+oSnHw4QoA++EmyFcBQ1gikgtyz82J5vlsVjMnYK+pdqGySkOuzsNlFGoC2VZQANgriFyiCMOntFQkD6N5iTaQZ10FgL2u3rtLCyEPV8Vz77MAt9tUzWUA7M2ZZL1Chvzrrx+yXycPOwqG7Ov6j/ApsDduRUOe43FQIdRr+y6rcUmoXqICwJ4oXMnTDJ3SkvNxAx+WV7Jd5H2sAsB+rP6vSjd0pYfqhpxLaa/kH/4NsB9sYgNeK4oL9Kd//sCltIPtfkTxwH6A6v7lmdIvH34quuDmKG7IVZ5ebPMpAOwVbW7IFVlDCEvvqzyXXbG5FNWYAsBe2CBHDNPdeTAnL2zczrIH9gIGOxLw8Dq56sGGAlYA2K3EzvRIwBXJQ8h3NoXTB1UA2Hca1pDnfsyTh+KPUobqOw040enAnmBsA660xk0va8ADeYLhJj8F2CMcwJAfFcXDobrqwoYCMQoA+wa1LpAX/hHKWgTXZ0TxDUbikIcKAPsdiQy5fu55C8RSn+uHLy6fKH7HSHy1WQFgX5HKkNW6R90dBsP0FWPwUTYFgD2Q8gL5x7K/GTfcThmmB0Zgt5gCwP4irUE3gKXTEHCG6cX8m4wDBaaH3ZDXmJeHj3oC8MAL2a2iwNSwG/SSUZx5eBU/ppANCkwLu0AvGc3DYfoGO3AIChRXYDrYHc1L3PlGFC/urxSwQ4GpYDfouYft4Vx8hy04FQWKKjAN7CVAB/KivknmmRWYAnaBnvN+9qd3by93t2W2B9mhQDEFhoc9J+jhnLyYRcgYBQopMDTsOUH36nohO5AtChRXYFjYc83RGbIX90EKqKTAkLDnAp1oXskLKaaKAsPCvvfymjuMKlagEBSooMBwsAvSPX+CyLC9gtdRxCEKDAW7QN9zic3XzQ+xBIWiQGEFhoM9dfgO6IU9jewPV2AY2BXVBWwK7IB+uB9SgQoKDAU7oFfwGIroVoEhYFdUT/0Vm85lQ4EZFBgG9pSoLtCBfQY3p41SoHvYBWvKXB3QAWA2BYaAPTaq+wctsxmb9s6twJSwM3Sf2+lnbX3XsAva2IU5/9PKrAan3fMq0D3ssUN4ovq8zj57y4F9dg+g/dMoMBXs3Ck3jV/T0BUFuoZdvzePGcYzhF/xAD6aRoFuYU9ZnAP2afyahq4o0DXsMVFdxwL7igfw0TQKTAM7N9JM49M09IYC08CuJ9CwocDMCkwDu1bi2VBgZgWAfWbr0/apFAD2qcxNY2dWYBrYuSd+Zjen7VKga9hjHxnNpTecfmYFuoVdRuMOupldl7bHKtA17IrUMTfWENlj3YPjR1IA2EeyJm1BgTsKTAW7/i2G6H7HG/hqaAW6hz32STXAPrQ/07g7CnQNu9rFIt0d6/IVCgQKdA977CId/7keWJ/dqRSYDnZ+6jqVf9PYQIEhYGcoH1iUXRS4oUD3sKtdsUN5ftt+wxv4eGgFhoGdVfmh/ZTGZVBgCNilA9E9gzeQxdAKTAs7C3VD+zWNW1FgKNhjF+qYu694BB8Nq8AwsMtCsUN5R3edx4YCoyswHOyx0d3Aj25o2ocCQ8Euc6ZEd+6qA4QZFBgSdqL7DK5LG2MVGA52CaDoHnvdncW6WNfh+N4UGBJ2A6/5eMyL4Xxv7kt9YxQYGnb9MUQM7F6sY3U+xoU4NpcCf/7n0/PWV0qZw8IuMVIW6wx8ipicgwJbFVhC/fWX989PP7zdFJw+v/3bN53ClnKHhz0FeObvW1yHY2IUWMItYGNHnbeOd95PP/3jbpWGhl0tF+wpw3mdw3D+ru/w5QMF5D8GUZH7Fqy5Phfs94AfHnYDnyIoD6h84M18/Y0CIeBfPvxYHPClX3/+/jzE/6ZiPf8jzFpjbn12MkDkM+Ytos+9lTefo4AUqBnB7Zu3UnUyqs9ymyKyn4zx+6foh1NaTIBfug3vTz7l1fPTfR355uD2uz2ppg1L4KeB3cA/vdu24rkUGuAB3Aq0FMWXfhq+nxp2Ax8KErMP8Hb3+VIDLh/IuZIe43+xx/oSna01VWQ37DJYrHA+HuDtOnOktrdgtw/0lIbRfTrYAX4OSPe20pDXuGRWsvMIo/uUsBv4lF/H2TB2hr1OxfltKXAarmsxt8J1cftS6dTRfVrYDXzKDTc2DsC3Beqe2tiWLUCu22a9mn7qfF5W/bfeTmv/dArsL54hIwP8Hkz6PvdoyH1NPITacC6VDY+JWSRUx6Ft6shuMQHeSsyTHgW559AhuCmq63xH7kepRgQ6HthflJbxU4dJEtvOk2I4zqmngO1Uc7i+BDxHa//8z2/PMbfjAvtC9b3A8/CLhaANva0NuQAP590lpBDwj6K6vwf2FQucgE+8y07C+tdyyofteAUMecwc14CkpKUBDxWNGcoDe6hcsL8XeDmJnSzIlt1KClh7pSNCbhnjYP+NObuFW6ZylC8f4h9rFUYDR/ll3rwvo4AhrzUfLzEXj1Fm6xrTuZ7AflfbM/D7fpPsp94oL7YyChwJeZkWPc5VUX3rqEXHaWM1/oGuZ+D3RXiG9Q9ETvjagCvd6vThqCtlv+Z8/JEkMUN41VsbsD9S9eXRVnturbVjeVgvB2VLU8CQ1xqqy3YnyF8eMZVW6/xnxcCuY7UB+0Y72MkM7p7UeQH9NvFDvWpF8QvkulW1sc5Z8H795X8jLrv9BuzbXO16lJ1uD+jhuc7vWgJ7VsDaKN26EBVqu2f/MlxvDPKLNhF3z0kHXY/XRmS3ghtTO2Hs30vdcj4W8K7CW1ulNYfpts0F8pXnt11refxezBBeIyFg32kzOaSdJEcaQq+8Z9mOBly26wVy+UT8bbLnqK5zieyJVNlJc4C+zMN5jwp92L7aQ/RQ654gt5vGRHW11VEd2K1gYmqnLeWwuqnHZfQMftgGAVZzkS2EW/vnYe31zxsSTX/IaQJXr2Wb7r0H9symkjPH/ALpnnFufdcL+CHY2j8abusZQp7Z/NWySwEd2AuYx05u5yqZ6nHYLs9pgSY9zNJlh2npTi9W1x6H6reET4E9zIs5e6jGzn07fW2H1+Leyal148fKK7VZa3n5M5WX+gz+WGBTjr/o0fjK+lbbCPQYv9LUMozqKgfYt6odcZyBSHHS3OeoI5CT2Pm1r5fruJbqWB1Tai0idxud32mo7s5uEMjtdvFR/dsrOsBuNTOnhkjQ2BlJ/1JEi1NH9vJQxsxmbCK72KguP1tGdTUE2Aub09ADel7QX41OBoviS5eMj+rnVftlPsC+VKTAewOvFOjToX81TJ/kxiOBrnbH+M1aVJdbA3sBuG9lCfTxoL8CfPAIvvQbQRsb1f/vu7+uDuGBfalupfdAfx/6E+AvvzbzzzMrmaapYmJBV/R/+vEfN9tAZL8pTfkvQuh7W/mOGVZuOfZ0qcgr6ZMM0e95mEDXwuMW7XyMojqw31O1ke9C8G280VNfDnTbGzFFE9XIHdXVKCJ7E6a9VsKOrzS2Z2+9c1jCrTayfauAQI+9ZHu6L+LOEF6lAPu3WjfzSQi+9mNXZY+EX3UF7nhXEugpUV3nPNqA/ZFCDX2/hL+Vef6ra97Mu3d5TCrowL5L9vZPXsLv94Iv5yhAed0C2mW2r1b7NRSw0jl2RLYFdLWeyN6+DyTV0BAuUznTl/f3741fnqP3bGUVELB6pYAO7GVtQ+4okFWBFNBPo60Nc3VXlMhuJUhR4CAFBHrJ4bubBexWghQFDlBAoKdEdT03XufFbMAeoxbHokBmBVJA17w+FnRVG9gzG4/sUGCrAgI2dfgO7FtV5jgUOFgB3cOuV+zq+6P73+81i8h+Tx2+Q4FCCqSAro7h3g9dHlUV2B8pxPcokFkBDcFT7n7UeSnDd1cf2K0EKQpUUECwpszTY6+przUF2NdU4TMUKKCAI3PsPD119X3ZBGBfKsJ7FCikgGBPBX3P8N3NAXYrQYoCBRUQrCnz9BzDdzcL2K0EKQoUUkCgp8zT9WvDHBHdzQJ2K0GKAgUUEKx6pQ7fc1YJ2HOqSV4oECiwF/ScUV3VAvbAOOyiQE4FUiP66XkDkT9y2VJvYN+iEsegQKQCAj1lnp7rMttadYF9TRU+Q4EdCuwFPffw3U0BditBOrwCgkgvPfXWQ2V/lqvxzi91QU7nl9qAvZSy5NuUAoLo1nVu/cVUDsj2gO7Op6RowF5SXfJuQgFB+Gj+vBf2PaA//fB9ls7mkdjA/kghvu9eAYH4aFh9+kOLHUPoLWXcqsPejmargYB9q1Ic16UCAmnrM/RTodN5t6YItwD35zo3tdxYgwB7rGIc35UCAslgPUpToNM5j6YIt8rVuSllphoA2FOV47wuFBBMt2Bbfh4Lno5PBb3GgtzSQMC+VIT3QylQCnblq8c5LzuMLe9rLcgtDQnsS0V4P5QCJWBXnjH5LjsAnXvEBuxHqE6Z1RSIgXILhDomJs810LeUU0IgYC+hKnk2o0AMmI8g1Pcx+bUEugwC7M24JRUpoUAMnPdg3wt6yt815dYD2HMrSn5NKZAT9mWk3vr+iJX3NSMA+5oqfDaMAjlgVx5aQd8Kd3hcK6DLoMA+jFvTkDUF9sK+B/SjLrGt6aDPgP2WMnw+hAJ7YNe5qTfNKLrr/JY2YG/JGtQluwKpsOcAHdizm5MMUeC2Aimwn0B//2PSHN0RvTXQpRCR/baf8M0ACsTCfgL9w3igA/sAzkwT7isQC7tWz8PV9Jh9laVXqxuRvVXLUK8sCmyFXb9537MY18JNM48EA/ZHCvF91wps/WXa1gdcrEX6lq6l3zMWsN9Th++6V2DPsHwN7OVnvYAuQwJ79+5MA24poCH8noi9BHv5vifQgf2Wl/D5EApsna8vId7yvjfQgX0Il6YRtxQoBXuPoAP7LS/h8yEUKAH7vfvdVd7aqxUxmbO3YgnqkV2B3LCvgR7CvbY+4O+zNy4hQ2BPEI1T+lAgJ+wh6AZY6ZZLe61cgwf2PvyWWiYokAt2g27ItwC+XOTTuUdvwH60BSi/mAI5YA9BXxumL6G+9b6F6A7sxVyNjI9WQKDegm/L54J7D+DLMo6O7sB+tEdSfhEFBNZWUHWsLqct4cz9HtiLmJpMZ1dAYG2FNWUOvjXv8Dhgn90raX8RBWJgD4Estd/CjTgM44u4GpkerUBrsB8d1WUPYD/aKym/iAItwd5CVAf2Im5Gpi0o0ArsLVxysz2I7FaCdCgFai263ZrjG/IWhu82LLBbCdKhFNh62e0WrCmfh4C3BLkNC+xWgnQoBWrB/vn7v736pVvLIgJ7y9ahbskK7L177l5kV0cSRvHkSlY+EdgrC05xdRQosUDXI+Ch2sAeqsH+MArkgj0EvMV5eIzBgD1GLY7tRgGBmQK8hug+12k3jX5QUWB/IBBf96uAYY2Zf+ucUTdgH9WytOukgIFX+uX9/7xaWPN3s0j1/0WolY4uaI5nAAAAAElFTkSuQmCC"/>
                                </defs>
                            </svg>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="faq-content">
                            <div className="accordion" id="accordionExample1">
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="headingOne">
                                        <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                        Accordion Item #1
                                        </button>
                                    </h2>
                                    <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionExample1">
                                        <div className="accordion-body">
                                            <strong>This is the first item's accordion body.</strong> It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code>, though the transition does limit overflow.
                                        </div>
                                    </div>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="headingTwo">
                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                        Accordion Item #2
                                        </button>
                                    </h2>
                                    <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExample1">
                                        <div className="accordion-body">
                                            <strong>This is the second item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code>, though the transition does limit overflow.
                                        </div>
                                    </div>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="headingThree">
                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                        Accordion Item #3
                                        </button>
                                    </h2>
                                    <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExample1">
                                        <div className="accordion-body">
                                            <strong>This is the third item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code>, though the transition does limit overflow.
                                        </div>
                                    </div>
                                </div>
                                <div className="accordion-item">
                                    <h2 className="accordion-header" id="headingFour">
                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseThree">
                                        Accordion Item #4
                                        </button>
                                    </h2>
                                    <div id="collapseFour" className="accordion-collapse collapse" aria-labelledby="headingFour" data-bs-parent="#accordionExample1">
                                        <div className="accordion-body">
                                            <strong>This is the third item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code>, though the transition does limit overflow.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default faq;