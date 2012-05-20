<?xml version="1.0"?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">
  <html>
  <head>
    <link rel="stylesheet" type="text/css" href="typeMap.css" />
  </head>
  <body>
    <h2><a name="toc">Zotero Item Types</a></h2>
    <table>
      <thead>
          <tr><th>Zotero type</th><th>CSL type</th></tr>
      </thead>
      <tbody>
      <xsl:for-each select="map/zTypes/typeMap">
        <xsl:sort select="@zType"/>
        <tr>
          <td><a href="#map-{@zType}"><xsl:value-of select="@zType"/></a></td>
          <td><xsl:value-of select="@cslType"/></td>
        </tr>
      </xsl:for-each>
      </tbody>
    </table>
    <xsl:for-each select="map/zTypes/typeMap">
    <xsl:sort select="@zType"/>
      <hr />
      (<a href="#toc">top</a>)
      <h3><a name="map-{@zType}"><xsl:value-of select="@zType"/> &#x2192; <xsl:value-of select="@cslType"/></a></h3>
      <table>
        <thead>
            <tr><th>Zotero field</th><th>CSL field</th></tr>
        </thead>
        <tbody>
        <xsl:for-each select="field">
        <xsl:sort select="@value"/>
          <tr>
            <td><xsl:value-of select="@value"/></td>
            <td><xsl:value-of select="/map/cslFieldMap/fieldMap[@zField=current()/@value]/@cslField"/></td>
          </tr>
          <xsl:if test="@value = 'creator'">
            <xsl:for-each select="creatorType">
            <xsl:sort select="@value"/>
              <tr>
                <td class="zSubType"><xsl:value-of select="@value"/></td>
                <td class="zSubType"><xsl:value-of select="/map/cslCreatorMap/creatorMap[@zCreator=current()/@value]/@cslCreator"/></td>
              </tr>
            </xsl:for-each>
          </xsl:if>
        </xsl:for-each>
        </tbody>
      </table>
    </xsl:for-each>
  </body>
  </html>
</xsl:template>

</xsl:stylesheet>