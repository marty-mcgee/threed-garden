<template>
  <div class="py-4 container-fluid">
    <div class="mt-4 row">
      <div class="col-12">
        <div class="card">
          <!-- Card header -->
          <div class="card-header">
            <h5 class="mb-0">Datatable Simple</h5>
            <p class="mb-0 text-sm">
              A lightweight, extendable, dependency-free javascript HTML table
              plugin.
            </p>
          </div>
          <div class="table-responsive">
            <table id="datatable-basic" class="table table-flush">
              <thead class="thead-light">
                <tr>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    Name
                  </th>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    Position
                  </th>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    Office
                  </th>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    Age
                  </th>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    Start date
                  </th>
                  <th
                    class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
                  >
                    Salary
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-sm font-weight-normal">Tiger Nixon</td>
                  <td class="text-sm font-weight-normal">System Architect</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">61</td>
                  <td class="text-sm font-weight-normal">2011/04/25</td>
                  <td class="text-sm font-weight-normal">$320,800</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Garrett Winters</td>
                  <td class="text-sm font-weight-normal">Accountant</td>
                  <td class="text-sm font-weight-normal">Tokyo</td>
                  <td class="text-sm font-weight-normal">63</td>
                  <td class="text-sm font-weight-normal">2011/07/25</td>
                  <td class="text-sm font-weight-normal">$170,750</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Ashton Cox</td>
                  <td class="text-sm font-weight-normal">
                    Junior Technical Author
                  </td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">66</td>
                  <td class="text-sm font-weight-normal">2009/01/12</td>
                  <td class="text-sm font-weight-normal">$86,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Cedric Kelly</td>
                  <td class="text-sm font-weight-normal">
                    Senior Javascript Developer
                  </td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">22</td>
                  <td class="text-sm font-weight-normal">2012/03/29</td>
                  <td class="text-sm font-weight-normal">$433,060</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Airi Satou</td>
                  <td class="text-sm font-weight-normal">Accountant</td>
                  <td class="text-sm font-weight-normal">Tokyo</td>
                  <td class="text-sm font-weight-normal">33</td>
                  <td class="text-sm font-weight-normal">2008/11/28</td>
                  <td class="text-sm font-weight-normal">$162,700</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Brielle Williamson</td>
                  <td class="text-sm font-weight-normal">
                    Integration Specialist
                  </td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">61</td>
                  <td class="text-sm font-weight-normal">2012/12/02</td>
                  <td class="text-sm font-weight-normal">$372,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Herrod Chandler</td>
                  <td class="text-sm font-weight-normal">Sales Assistant</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">59</td>
                  <td class="text-sm font-weight-normal">2012/08/06</td>
                  <td class="text-sm font-weight-normal">$137,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Rhona Davidson</td>
                  <td class="text-sm font-weight-normal">
                    Integration Specialist
                  </td>
                  <td class="text-sm font-weight-normal">Tokyo</td>
                  <td class="text-sm font-weight-normal">55</td>
                  <td class="text-sm font-weight-normal">2010/10/14</td>
                  <td class="text-sm font-weight-normal">$327,900</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Colleen Hurst</td>
                  <td class="text-sm font-weight-normal">
                    Javascript Developer
                  </td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">39</td>
                  <td class="text-sm font-weight-normal">2009/09/15</td>
                  <td class="text-sm font-weight-normal">$205,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Sonya Frost</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">23</td>
                  <td class="text-sm font-weight-normal">2008/12/13</td>
                  <td class="text-sm font-weight-normal">$103,600</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jena Gaines</td>
                  <td class="text-sm font-weight-normal">Office Manager</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">30</td>
                  <td class="text-sm font-weight-normal">2008/12/19</td>
                  <td class="text-sm font-weight-normal">$90,560</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Quinn Flynn</td>
                  <td class="text-sm font-weight-normal">Support Lead</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">22</td>
                  <td class="text-sm font-weight-normal">2013/03/03</td>
                  <td class="text-sm font-weight-normal">$342,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Charde Marshall</td>
                  <td class="text-sm font-weight-normal">Regional Director</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">36</td>
                  <td class="text-sm font-weight-normal">2008/10/16</td>
                  <td class="text-sm font-weight-normal">$470,600</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Haley Kennedy</td>
                  <td class="text-sm font-weight-normal">
                    Senior Marketing Designer
                  </td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">43</td>
                  <td class="text-sm font-weight-normal">2012/12/18</td>
                  <td class="text-sm font-weight-normal">$313,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">
                    Tatyana Fitzpatrick
                  </td>
                  <td class="text-sm font-weight-normal">Regional Director</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">19</td>
                  <td class="text-sm font-weight-normal">2010/03/17</td>
                  <td class="text-sm font-weight-normal">$385,750</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Michael Silva</td>
                  <td class="text-sm font-weight-normal">Marketing Designer</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">66</td>
                  <td class="text-sm font-weight-normal">2012/11/27</td>
                  <td class="text-sm font-weight-normal">$198,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Paul Byrd</td>
                  <td class="text-sm font-weight-normal">
                    Chief Financial Officer (CFO)
                  </td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">64</td>
                  <td class="text-sm font-weight-normal">2010/06/09</td>
                  <td class="text-sm font-weight-normal">$725,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Gloria Little</td>
                  <td class="text-sm font-weight-normal">
                    Systems Administrator
                  </td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">59</td>
                  <td class="text-sm font-weight-normal">2009/04/10</td>
                  <td class="text-sm font-weight-normal">$237,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Bradley Greer</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">41</td>
                  <td class="text-sm font-weight-normal">2012/10/13</td>
                  <td class="text-sm font-weight-normal">$132,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Dai Rios</td>
                  <td class="text-sm font-weight-normal">Personnel Lead</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">35</td>
                  <td class="text-sm font-weight-normal">2012/09/26</td>
                  <td class="text-sm font-weight-normal">$217,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jenette Caldwell</td>
                  <td class="text-sm font-weight-normal">Development Lead</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">30</td>
                  <td class="text-sm font-weight-normal">2011/09/03</td>
                  <td class="text-sm font-weight-normal">$345,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Yuri Berry</td>
                  <td class="text-sm font-weight-normal">
                    Chief Marketing Officer (CMO)
                  </td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">40</td>
                  <td class="text-sm font-weight-normal">2009/06/25</td>
                  <td class="text-sm font-weight-normal">$675,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Caesar Vance</td>
                  <td class="text-sm font-weight-normal">Pre-Sales Support</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">21</td>
                  <td class="text-sm font-weight-normal">2011/12/12</td>
                  <td class="text-sm font-weight-normal">$106,450</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Doris Wilder</td>
                  <td class="text-sm font-weight-normal">Sales Assistant</td>
                  <td class="text-sm font-weight-normal">Sidney</td>
                  <td class="text-sm font-weight-normal">23</td>
                  <td class="text-sm font-weight-normal">2010/09/20</td>
                  <td class="text-sm font-weight-normal">$85,600</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Angelica Ramos</td>
                  <td class="text-sm font-weight-normal">
                    Chief Executive Officer (CEO)
                  </td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">47</td>
                  <td class="text-sm font-weight-normal">2009/10/09</td>
                  <td class="text-sm font-weight-normal">$1,200,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Gavin Joyce</td>
                  <td class="text-sm font-weight-normal">Developer</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">42</td>
                  <td class="text-sm font-weight-normal">2010/12/22</td>
                  <td class="text-sm font-weight-normal">$92,575</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jennifer Chang</td>
                  <td class="text-sm font-weight-normal">Regional Director</td>
                  <td class="text-sm font-weight-normal">Singapore</td>
                  <td class="text-sm font-weight-normal">28</td>
                  <td class="text-sm font-weight-normal">2010/11/14</td>
                  <td class="text-sm font-weight-normal">$357,650</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Brenden Wagner</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">28</td>
                  <td class="text-sm font-weight-normal">2011/06/07</td>
                  <td class="text-sm font-weight-normal">$206,850</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Fiona Green</td>
                  <td class="text-sm font-weight-normal">
                    Chief Operating Officer (COO)
                  </td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">48</td>
                  <td class="text-sm font-weight-normal">2010/03/11</td>
                  <td class="text-sm font-weight-normal">$850,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Shou Itou</td>
                  <td class="text-sm font-weight-normal">Regional Marketing</td>
                  <td class="text-sm font-weight-normal">Tokyo</td>
                  <td class="text-sm font-weight-normal">20</td>
                  <td class="text-sm font-weight-normal">2011/08/14</td>
                  <td class="text-sm font-weight-normal">$163,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Michelle House</td>
                  <td class="text-sm font-weight-normal">
                    Integration Specialist
                  </td>
                  <td class="text-sm font-weight-normal">Sidney</td>
                  <td class="text-sm font-weight-normal">37</td>
                  <td class="text-sm font-weight-normal">2011/06/02</td>
                  <td class="text-sm font-weight-normal">$95,400</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Suki Burks</td>
                  <td class="text-sm font-weight-normal">Developer</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">53</td>
                  <td class="text-sm font-weight-normal">2009/10/22</td>
                  <td class="text-sm font-weight-normal">$114,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Prescott Bartlett</td>
                  <td class="text-sm font-weight-normal">Technical Author</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">27</td>
                  <td class="text-sm font-weight-normal">2011/05/07</td>
                  <td class="text-sm font-weight-normal">$145,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Gavin Cortez</td>
                  <td class="text-sm font-weight-normal">Team Leader</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">22</td>
                  <td class="text-sm font-weight-normal">2008/10/26</td>
                  <td class="text-sm font-weight-normal">$235,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Martena Mccray</td>
                  <td class="text-sm font-weight-normal">Post-Sales support</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">46</td>
                  <td class="text-sm font-weight-normal">2011/03/09</td>
                  <td class="text-sm font-weight-normal">$324,050</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Unity Butler</td>
                  <td class="text-sm font-weight-normal">Marketing Designer</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">47</td>
                  <td class="text-sm font-weight-normal">2009/12/09</td>
                  <td class="text-sm font-weight-normal">$85,675</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Howard Hatfield</td>
                  <td class="text-sm font-weight-normal">Office Manager</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">51</td>
                  <td class="text-sm font-weight-normal">2008/12/16</td>
                  <td class="text-sm font-weight-normal">$164,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Hope Fuentes</td>
                  <td class="text-sm font-weight-normal">Secretary</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">41</td>
                  <td class="text-sm font-weight-normal">2010/02/12</td>
                  <td class="text-sm font-weight-normal">$109,850</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Vivian Harrell</td>
                  <td class="text-sm font-weight-normal">
                    Financial Controller
                  </td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">62</td>
                  <td class="text-sm font-weight-normal">2009/02/14</td>
                  <td class="text-sm font-weight-normal">$452,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Timothy Mooney</td>
                  <td class="text-sm font-weight-normal">Office Manager</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">37</td>
                  <td class="text-sm font-weight-normal">2008/12/11</td>
                  <td class="text-sm font-weight-normal">$136,200</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jackson Bradshaw</td>
                  <td class="text-sm font-weight-normal">Director</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">65</td>
                  <td class="text-sm font-weight-normal">2008/09/26</td>
                  <td class="text-sm font-weight-normal">$645,750</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Olivia Liang</td>
                  <td class="text-sm font-weight-normal">Support Engineer</td>
                  <td class="text-sm font-weight-normal">Singapore</td>
                  <td class="text-sm font-weight-normal">64</td>
                  <td class="text-sm font-weight-normal">2011/02/03</td>
                  <td class="text-sm font-weight-normal">$234,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Bruno Nash</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">38</td>
                  <td class="text-sm font-weight-normal">2011/05/03</td>
                  <td class="text-sm font-weight-normal">$163,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Sakura Yamamoto</td>
                  <td class="text-sm font-weight-normal">Support Engineer</td>
                  <td class="text-sm font-weight-normal">Tokyo</td>
                  <td class="text-sm font-weight-normal">37</td>
                  <td class="text-sm font-weight-normal">2009/08/19</td>
                  <td class="text-sm font-weight-normal">$139,575</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Thor Walton</td>
                  <td class="text-sm font-weight-normal">Developer</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">61</td>
                  <td class="text-sm font-weight-normal">2013/08/11</td>
                  <td class="text-sm font-weight-normal">$98,540</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Finn Camacho</td>
                  <td class="text-sm font-weight-normal">Support Engineer</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">47</td>
                  <td class="text-sm font-weight-normal">2009/07/07</td>
                  <td class="text-sm font-weight-normal">$87,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Serge Baldwin</td>
                  <td class="text-sm font-weight-normal">Data Coordinator</td>
                  <td class="text-sm font-weight-normal">Singapore</td>
                  <td class="text-sm font-weight-normal">64</td>
                  <td class="text-sm font-weight-normal">2012/04/09</td>
                  <td class="text-sm font-weight-normal">$138,575</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Zenaida Frank</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">63</td>
                  <td class="text-sm font-weight-normal">2010/01/04</td>
                  <td class="text-sm font-weight-normal">$125,250</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Zorita Serrano</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">56</td>
                  <td class="text-sm font-weight-normal">2012/06/01</td>
                  <td class="text-sm font-weight-normal">$115,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jennifer Acosta</td>
                  <td class="text-sm font-weight-normal">
                    Junior Javascript Developer
                  </td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">43</td>
                  <td class="text-sm font-weight-normal">2013/02/01</td>
                  <td class="text-sm font-weight-normal">$75,650</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Cara Stevens</td>
                  <td class="text-sm font-weight-normal">Sales Assistant</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">46</td>
                  <td class="text-sm font-weight-normal">2011/12/06</td>
                  <td class="text-sm font-weight-normal">$145,600</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Hermione Butler</td>
                  <td class="text-sm font-weight-normal">Regional Director</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">47</td>
                  <td class="text-sm font-weight-normal">2011/03/21</td>
                  <td class="text-sm font-weight-normal">$356,250</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Lael Greer</td>
                  <td class="text-sm font-weight-normal">
                    Systems Administrator
                  </td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">21</td>
                  <td class="text-sm font-weight-normal">2009/02/27</td>
                  <td class="text-sm font-weight-normal">$103,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jonas Alexander</td>
                  <td class="text-sm font-weight-normal">Developer</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">30</td>
                  <td class="text-sm font-weight-normal">2010/07/14</td>
                  <td class="text-sm font-weight-normal">$86,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Shad Decker</td>
                  <td class="text-sm font-weight-normal">Regional Director</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">51</td>
                  <td class="text-sm font-weight-normal">2008/11/13</td>
                  <td class="text-sm font-weight-normal">$183,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Michael Bruce</td>
                  <td class="text-sm font-weight-normal">
                    Javascript Developer
                  </td>
                  <td class="text-sm font-weight-normal">Singapore</td>
                  <td class="text-sm font-weight-normal">29</td>
                  <td class="text-sm font-weight-normal">2011/06/27</td>
                  <td class="text-sm font-weight-normal">$183,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Donna Snider</td>
                  <td class="text-sm font-weight-normal">Customer Support</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">27</td>
                  <td class="text-sm font-weight-normal">2011/01/25</td>
                  <td class="text-sm font-weight-normal">$112,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-12">
        <div class="card">
          <!-- Card header -->
          <div class="card-header">
            <h5 class="mb-0">Datatable Search</h5>
            <p class="mb-0 text-sm">
              A lightweight, extendable, dependency-free javascript HTML table
              plugin.
            </p>
          </div>
          <div class="table-responsive">
            <table id="datatable-search" class="table table-flush">
              <thead class="thead-light">
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Office</th>
                  <th>Age</th>
                  <th>Start date</th>
                  <th>Salary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-sm font-weight-normal">Tiger Nixon</td>
                  <td class="text-sm font-weight-normal">System Architect</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">61</td>
                  <td class="text-sm font-weight-normal">2011/04/25</td>
                  <td class="text-sm font-weight-normal">$320,800</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Garrett Winters</td>
                  <td class="text-sm font-weight-normal">Accountant</td>
                  <td class="text-sm font-weight-normal">Tokyo</td>
                  <td class="text-sm font-weight-normal">63</td>
                  <td class="text-sm font-weight-normal">2011/07/25</td>
                  <td class="text-sm font-weight-normal">$170,750</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Ashton Cox</td>
                  <td class="text-sm font-weight-normal">
                    Junior Technical Author
                  </td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">66</td>
                  <td class="text-sm font-weight-normal">2009/01/12</td>
                  <td class="text-sm font-weight-normal">$86,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Cedric Kelly</td>
                  <td class="text-sm font-weight-normal">
                    Senior Javascript Developer
                  </td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">22</td>
                  <td class="text-sm font-weight-normal">2012/03/29</td>
                  <td class="text-sm font-weight-normal">$433,060</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Airi Satou</td>
                  <td class="text-sm font-weight-normal">Accountant</td>
                  <td class="text-sm font-weight-normal">Tokyo</td>
                  <td class="text-sm font-weight-normal">33</td>
                  <td class="text-sm font-weight-normal">2008/11/28</td>
                  <td class="text-sm font-weight-normal">$162,700</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Brielle Williamson</td>
                  <td class="text-sm font-weight-normal">
                    Integration Specialist
                  </td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">61</td>
                  <td class="text-sm font-weight-normal">2012/12/02</td>
                  <td class="text-sm font-weight-normal">$372,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Herrod Chandler</td>
                  <td class="text-sm font-weight-normal">Sales Assistant</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">59</td>
                  <td class="text-sm font-weight-normal">2012/08/06</td>
                  <td class="text-sm font-weight-normal">$137,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Rhona Davidson</td>
                  <td class="text-sm font-weight-normal">
                    Integration Specialist
                  </td>
                  <td class="text-sm font-weight-normal">Tokyo</td>
                  <td class="text-sm font-weight-normal">55</td>
                  <td class="text-sm font-weight-normal">2010/10/14</td>
                  <td class="text-sm font-weight-normal">$327,900</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Colleen Hurst</td>
                  <td class="text-sm font-weight-normal">
                    Javascript Developer
                  </td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">39</td>
                  <td class="text-sm font-weight-normal">2009/09/15</td>
                  <td class="text-sm font-weight-normal">$205,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Sonya Frost</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">23</td>
                  <td class="text-sm font-weight-normal">2008/12/13</td>
                  <td class="text-sm font-weight-normal">$103,600</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jena Gaines</td>
                  <td class="text-sm font-weight-normal">Office Manager</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">30</td>
                  <td class="text-sm font-weight-normal">2008/12/19</td>
                  <td class="text-sm font-weight-normal">$90,560</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Quinn Flynn</td>
                  <td class="text-sm font-weight-normal">Support Lead</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">22</td>
                  <td class="text-sm font-weight-normal">2013/03/03</td>
                  <td class="text-sm font-weight-normal">$342,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Charde Marshall</td>
                  <td class="text-sm font-weight-normal">Regional Director</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">36</td>
                  <td class="text-sm font-weight-normal">2008/10/16</td>
                  <td class="text-sm font-weight-normal">$470,600</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Haley Kennedy</td>
                  <td class="text-sm font-weight-normal">
                    Senior Marketing Designer
                  </td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">43</td>
                  <td class="text-sm font-weight-normal">2012/12/18</td>
                  <td class="text-sm font-weight-normal">$313,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">
                    Tatyana Fitzpatrick
                  </td>
                  <td class="text-sm font-weight-normal">Regional Director</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">19</td>
                  <td class="text-sm font-weight-normal">2010/03/17</td>
                  <td class="text-sm font-weight-normal">$385,750</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Michael Silva</td>
                  <td class="text-sm font-weight-normal">Marketing Designer</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">66</td>
                  <td class="text-sm font-weight-normal">2012/11/27</td>
                  <td class="text-sm font-weight-normal">$198,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Paul Byrd</td>
                  <td class="text-sm font-weight-normal">
                    Chief Financial Officer (CFO)
                  </td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">64</td>
                  <td class="text-sm font-weight-normal">2010/06/09</td>
                  <td class="text-sm font-weight-normal">$725,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Gloria Little</td>
                  <td class="text-sm font-weight-normal">
                    Systems Administrator
                  </td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">59</td>
                  <td class="text-sm font-weight-normal">2009/04/10</td>
                  <td class="text-sm font-weight-normal">$237,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Bradley Greer</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">41</td>
                  <td class="text-sm font-weight-normal">2012/10/13</td>
                  <td class="text-sm font-weight-normal">$132,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Dai Rios</td>
                  <td class="text-sm font-weight-normal">Personnel Lead</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">35</td>
                  <td class="text-sm font-weight-normal">2012/09/26</td>
                  <td class="text-sm font-weight-normal">$217,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jenette Caldwell</td>
                  <td class="text-sm font-weight-normal">Development Lead</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">30</td>
                  <td class="text-sm font-weight-normal">2011/09/03</td>
                  <td class="text-sm font-weight-normal">$345,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Yuri Berry</td>
                  <td class="text-sm font-weight-normal">
                    Chief Marketing Officer (CMO)
                  </td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">40</td>
                  <td class="text-sm font-weight-normal">2009/06/25</td>
                  <td class="text-sm font-weight-normal">$675,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Caesar Vance</td>
                  <td class="text-sm font-weight-normal">Pre-Sales Support</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">21</td>
                  <td class="text-sm font-weight-normal">2011/12/12</td>
                  <td class="text-sm font-weight-normal">$106,450</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Doris Wilder</td>
                  <td class="text-sm font-weight-normal">Sales Assistant</td>
                  <td class="text-sm font-weight-normal">Sidney</td>
                  <td class="text-sm font-weight-normal">23</td>
                  <td class="text-sm font-weight-normal">2010/09/20</td>
                  <td class="text-sm font-weight-normal">$85,600</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Angelica Ramos</td>
                  <td class="text-sm font-weight-normal">
                    Chief Executive Officer (CEO)
                  </td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">47</td>
                  <td class="text-sm font-weight-normal">2009/10/09</td>
                  <td class="text-sm font-weight-normal">$1,200,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Gavin Joyce</td>
                  <td class="text-sm font-weight-normal">Developer</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">42</td>
                  <td class="text-sm font-weight-normal">2010/12/22</td>
                  <td class="text-sm font-weight-normal">$92,575</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jennifer Chang</td>
                  <td class="text-sm font-weight-normal">Regional Director</td>
                  <td class="text-sm font-weight-normal">Singapore</td>
                  <td class="text-sm font-weight-normal">28</td>
                  <td class="text-sm font-weight-normal">2010/11/14</td>
                  <td class="text-sm font-weight-normal">$357,650</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Brenden Wagner</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">28</td>
                  <td class="text-sm font-weight-normal">2011/06/07</td>
                  <td class="text-sm font-weight-normal">$206,850</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Fiona Green</td>
                  <td class="text-sm font-weight-normal">
                    Chief Operating Officer (COO)
                  </td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">48</td>
                  <td class="text-sm font-weight-normal">2010/03/11</td>
                  <td class="text-sm font-weight-normal">$850,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Shou Itou</td>
                  <td class="text-sm font-weight-normal">Regional Marketing</td>
                  <td class="text-sm font-weight-normal">Tokyo</td>
                  <td class="text-sm font-weight-normal">20</td>
                  <td class="text-sm font-weight-normal">2011/08/14</td>
                  <td class="text-sm font-weight-normal">$163,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Michelle House</td>
                  <td class="text-sm font-weight-normal">
                    Integration Specialist
                  </td>
                  <td class="text-sm font-weight-normal">Sidney</td>
                  <td class="text-sm font-weight-normal">37</td>
                  <td class="text-sm font-weight-normal">2011/06/02</td>
                  <td class="text-sm font-weight-normal">$95,400</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Suki Burks</td>
                  <td class="text-sm font-weight-normal">Developer</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">53</td>
                  <td class="text-sm font-weight-normal">2009/10/22</td>
                  <td class="text-sm font-weight-normal">$114,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Prescott Bartlett</td>
                  <td class="text-sm font-weight-normal">Technical Author</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">27</td>
                  <td class="text-sm font-weight-normal">2011/05/07</td>
                  <td class="text-sm font-weight-normal">$145,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Gavin Cortez</td>
                  <td class="text-sm font-weight-normal">Team Leader</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">22</td>
                  <td class="text-sm font-weight-normal">2008/10/26</td>
                  <td class="text-sm font-weight-normal">$235,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Martena Mccray</td>
                  <td class="text-sm font-weight-normal">Post-Sales support</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">46</td>
                  <td class="text-sm font-weight-normal">2011/03/09</td>
                  <td class="text-sm font-weight-normal">$324,050</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Unity Butler</td>
                  <td class="text-sm font-weight-normal">Marketing Designer</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">47</td>
                  <td class="text-sm font-weight-normal">2009/12/09</td>
                  <td class="text-sm font-weight-normal">$85,675</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Howard Hatfield</td>
                  <td class="text-sm font-weight-normal">Office Manager</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">51</td>
                  <td class="text-sm font-weight-normal">2008/12/16</td>
                  <td class="text-sm font-weight-normal">$164,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Hope Fuentes</td>
                  <td class="text-sm font-weight-normal">Secretary</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">41</td>
                  <td class="text-sm font-weight-normal">2010/02/12</td>
                  <td class="text-sm font-weight-normal">$109,850</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Vivian Harrell</td>
                  <td class="text-sm font-weight-normal">
                    Financial Controller
                  </td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">62</td>
                  <td class="text-sm font-weight-normal">2009/02/14</td>
                  <td class="text-sm font-weight-normal">$452,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Timothy Mooney</td>
                  <td class="text-sm font-weight-normal">Office Manager</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">37</td>
                  <td class="text-sm font-weight-normal">2008/12/11</td>
                  <td class="text-sm font-weight-normal">$136,200</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jackson Bradshaw</td>
                  <td class="text-sm font-weight-normal">Director</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">65</td>
                  <td class="text-sm font-weight-normal">2008/09/26</td>
                  <td class="text-sm font-weight-normal">$645,750</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Olivia Liang</td>
                  <td class="text-sm font-weight-normal">Support Engineer</td>
                  <td class="text-sm font-weight-normal">Singapore</td>
                  <td class="text-sm font-weight-normal">64</td>
                  <td class="text-sm font-weight-normal">2011/02/03</td>
                  <td class="text-sm font-weight-normal">$234,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Bruno Nash</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">38</td>
                  <td class="text-sm font-weight-normal">2011/05/03</td>
                  <td class="text-sm font-weight-normal">$163,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Sakura Yamamoto</td>
                  <td class="text-sm font-weight-normal">Support Engineer</td>
                  <td class="text-sm font-weight-normal">Tokyo</td>
                  <td class="text-sm font-weight-normal">37</td>
                  <td class="text-sm font-weight-normal">2009/08/19</td>
                  <td class="text-sm font-weight-normal">$139,575</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Thor Walton</td>
                  <td class="text-sm font-weight-normal">Developer</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">61</td>
                  <td class="text-sm font-weight-normal">2013/08/11</td>
                  <td class="text-sm font-weight-normal">$98,540</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Finn Camacho</td>
                  <td class="text-sm font-weight-normal">Support Engineer</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">47</td>
                  <td class="text-sm font-weight-normal">2009/07/07</td>
                  <td class="text-sm font-weight-normal">$87,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Serge Baldwin</td>
                  <td class="text-sm font-weight-normal">Data Coordinator</td>
                  <td class="text-sm font-weight-normal">Singapore</td>
                  <td class="text-sm font-weight-normal">64</td>
                  <td class="text-sm font-weight-normal">2012/04/09</td>
                  <td class="text-sm font-weight-normal">$138,575</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Zenaida Frank</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">63</td>
                  <td class="text-sm font-weight-normal">2010/01/04</td>
                  <td class="text-sm font-weight-normal">$125,250</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Zorita Serrano</td>
                  <td class="text-sm font-weight-normal">Software Engineer</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">56</td>
                  <td class="text-sm font-weight-normal">2012/06/01</td>
                  <td class="text-sm font-weight-normal">$115,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jennifer Acosta</td>
                  <td class="text-sm font-weight-normal">
                    Junior Javascript Developer
                  </td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">43</td>
                  <td class="text-sm font-weight-normal">2013/02/01</td>
                  <td class="text-sm font-weight-normal">$75,650</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Cara Stevens</td>
                  <td class="text-sm font-weight-normal">Sales Assistant</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">46</td>
                  <td class="text-sm font-weight-normal">2011/12/06</td>
                  <td class="text-sm font-weight-normal">$145,600</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Hermione Butler</td>
                  <td class="text-sm font-weight-normal">Regional Director</td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">47</td>
                  <td class="text-sm font-weight-normal">2011/03/21</td>
                  <td class="text-sm font-weight-normal">$356,250</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Lael Greer</td>
                  <td class="text-sm font-weight-normal">
                    Systems Administrator
                  </td>
                  <td class="text-sm font-weight-normal">London</td>
                  <td class="text-sm font-weight-normal">21</td>
                  <td class="text-sm font-weight-normal">2009/02/27</td>
                  <td class="text-sm font-weight-normal">$103,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Jonas Alexander</td>
                  <td class="text-sm font-weight-normal">Developer</td>
                  <td class="text-sm font-weight-normal">San Francisco</td>
                  <td class="text-sm font-weight-normal">30</td>
                  <td class="text-sm font-weight-normal">2010/07/14</td>
                  <td class="text-sm font-weight-normal">$86,500</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Shad Decker</td>
                  <td class="text-sm font-weight-normal">Regional Director</td>
                  <td class="text-sm font-weight-normal">Edinburgh</td>
                  <td class="text-sm font-weight-normal">51</td>
                  <td class="text-sm font-weight-normal">2008/11/13</td>
                  <td class="text-sm font-weight-normal">$183,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Michael Bruce</td>
                  <td class="text-sm font-weight-normal">
                    Javascript Developer
                  </td>
                  <td class="text-sm font-weight-normal">Singapore</td>
                  <td class="text-sm font-weight-normal">29</td>
                  <td class="text-sm font-weight-normal">2011/06/27</td>
                  <td class="text-sm font-weight-normal">$183,000</td>
                </tr>
                <tr>
                  <td class="text-sm font-weight-normal">Donna Snider</td>
                  <td class="text-sm font-weight-normal">Customer Support</td>
                  <td class="text-sm font-weight-normal">New York</td>
                  <td class="text-sm font-weight-normal">27</td>
                  <td class="text-sm font-weight-normal">2011/01/25</td>
                  <td class="text-sm font-weight-normal">$112,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DataTable } from "simple-datatables";

export default {
  name: "DataTables",
  mounted() {
    // eslint-disable-next-line no-unused-vars
    const dataTableBasic = new DataTable("#datatable-basic", {
      searchable: false,
      fixedHeight: true,
    });

    // eslint-disable-next-line no-unused-vars
    const dataTableSearch = new DataTable("#datatable-search", {
      searchable: true,
      fixedHeight: true,
    });
  },
};
</script>
