import RegExp2 from '../src/index'

test(`new RegExp2('(?=(a+))').exec('baaabac')`, () => {
    expect(new RegExp2('(?=(a+))').exec('baaabac')).toEqual(new RegExp('(?=(a+))').exec('baaabac'));
});

test(`new RegExp2('(?=(a+))a*b\\1').exec('baaabac')`, () => {
    expect(new RegExp2('(?=(a+))a*b\\1').exec('baaabac')).toEqual(new RegExp('(?=(a+))a*b\\1').exec('baaabac'));
});

test(`new RegExp2('(.*?)a(?!(a+)b\\2c)\\2(.*)').exec('baaabac')`, () => {
    expect(new RegExp2('(.*?)a(?!(a+)b\\2c)\\2(.*)').exec('baaabac')).toEqual(new RegExp('(.*?)a(?!(a+)b\\2c)\\2(.*)').exec('baaabac'));
});

test(`new RegExp2('(a*)b\\1+').exec('baaabac')`, () => {
    expect(new RegExp2('(a*)b\\1+').exec('baaabac')).toEqual(new RegExp('(a*)b\\1+').exec('baaabac'));
});

test(`new RegExp2('(z)((a+)?(b+)?(c))*').exec('zaacbbbcac')`, () => {
    expect(new RegExp2('(z)((a+)?(b+)?(c))*').exec('zaacbbbcac')).toEqual(new RegExp('(z)((a+)?(b+)?(c))*').exec('zaacbbbcac'));
});

test(`new RegExp2('(aa|aabaac|ba|b|c)*').exec('aabaac')`, () => {
    expect(new RegExp2('(aa|aabaac|ba|b|c)*').exec('aabaac')).toEqual(new RegExp('(aa|aabaac|ba|b|c)*').exec('aabaac'));
});

test(`new RegExp2('a[a-z]{2,4}?').exec('abcdefghi')`, () => {
    expect(new RegExp2('a[a-z]{2,4}?').exec('abcdefghi')).toEqual(new RegExp('a[a-z]{2,4}?').exec('abcdefghi'));
});

test(`new RegExp2('^(13[0-9]{1}|14[5|7|9]{1}|15[0-3|5-9]{1}|166|17[0-3|5-8]{1}|18[0-9]{1}|19[8-9]{1}){1}\\d{8}$').exec('13505151759')`, () => {
    expect(new RegExp2('^(13[0-9]{1}|14[5|7|9]{1}|15[0-3|5-9]{1}|166|17[0-3|5-8]{1}|18[0-9]{1}|19[8-9]{1}){1}\\d{8}$').exec('13505151759')).toEqual(new RegExp('^(13[0-9]{1}|14[5|7|9]{1}|15[0-3|5-9]{1}|166|17[0-3|5-8]{1}|18[0-9]{1}|19[8-9]{1}){1}\\d{8}$').exec('13505151759'));
});

test(`new RegExp2('^.*(?=.{6,})(?=.*\\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*? ]).*$').exec('caibaojian#')`, () => {
    expect(new RegExp2('^.*(?=.{6,})(?=.*\\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*? ]).*$').exec('caibaojian#')).toEqual(new RegExp('^.*(?=.{6,})(?=.*\\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*? ]).*$').exec('caibaojian#'));
});


test(`new RegExp2('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$').exec('115.28.47.26')`, () => {
    expect(new RegExp2('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$').exec('115.28.47.26')).toEqual(new RegExp('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$').exec('115.28.47.26'));
});

test(`new RegExp2('^1[^a-cd0-9]').exec('12')`, () => {
    expect(new RegExp2('^1[^a-cd0-9]').exec('12')).toEqual(new RegExp('^1[^a-cd0-9]').exec('12'));
});

test(`new RegExp2('^1[^a-c]').exec('1d')`, () => {
    expect(new RegExp2('^1[^a-c]').exec('1d')).toEqual(new RegExp('^1[^a-c]').exec('1d'));
});

test(`new RegExp2('^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$').exec('#b8b8b8')`, () => {
    expect(new RegExp2('^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$').exec('#b8b8b8')).toEqual(new RegExp('^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$').exec('#b8b8b8'));
});

test(`new RegExp2('^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$').exec('2017-02-11')`, () => {
    expect(new RegExp2('^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$').exec('2017-02-11')).toEqual(new RegExp('^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$').exec('2017-02-11'));
});

test(`new RegExp2('^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$').exec('2017-15-11')`, () => {
    expect(new RegExp2('^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$').exec('2017-15-11')).toEqual(new RegExp('^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$').exec('2017-15-11'));
});

test(`new RegExp2('^[a-zA-Z]([-_a-zA-Z0-9]{5,19})+$').exec('caibaojian_com')`, () => {
    expect(new RegExp2('^[a-zA-Z]([-_a-zA-Z0-9]{5,19})+$').exec('caibaojian_com')).toEqual(new RegExp('^[a-zA-Z]([-_a-zA-Z0-9]{5,19})+$').exec('caibaojian_com'));
});

test(`new RegExp2('^[a-zA-Z]([^-a]{5,19})+$').exec('caibaojian_com')`, () => {
    expect(new RegExp2('^[a-zA-Z]([^-a]{5,19})+$').exec('caibaojian_com')).toEqual(new RegExp('^[a-zA-Z]([^-a]{5,19})+$').exec('caibaojian_com'));
});

test(`new RegExp2('^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$').exec('粤B39006')`, () => {
    expect(new RegExp2('^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$').exec('粤B39006')).toEqual(new RegExp('^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$').exec('粤B39006'));
});

test(`new RegExp2('[abc]\\b]').exec('a%]')`, () => {
    expect(new RegExp2('[abc]\\b]').exec('a%]')).toEqual(new RegExp('[abc]\\b]').exec('a%]'));
});

test(`new RegExp2('[abc]\\b]').exec('a%]')`, () => {
    expect(new RegExp2('[abc]\\b]').exec('a%]')).toEqual(new RegExp('[abc]\\b]').exec('a%]'));
});

test(`new RegExp2('.{2}\\d\\D(\\w)\\W\\1(?=asd)').exec('aa1ww#wasd')`, () => {
    expect(new RegExp2('.{2}\\d\\D(\\w)\\W\\1(?=asd)').exec('aa1ww#wasd')).toEqual(new RegExp('.{2}\\d\\D(\\w)\\W\\1(?=asd)').exec('aa1ww#wasd'));
});

test(`new RegExp2('.{2}(\\d)\\1(a|b)(?=asd)').exec('aa11aasd')`, () => {
    expect(new RegExp2('.{2}(\\d)\\1(a|b)(?=asd)').exec('aa11aasd')).toEqual(new RegExp('.{2}(\\d)\\1(a|b)(?=asd)').exec('aa11aasd'));
});

test(`new RegExp2('[\\u4e00-\\u9fa5]').exec('是')`, () => {
    expect(new RegExp2('[\\u4e00-\\u9fa5]').exec('是')).toEqual(new RegExp('[\\u4e00-\\u9fa5]').exec('是'));
});

test(`new RegExp2('a{1,}').exec('baaaac')`, () => {
    expect(new RegExp2('a{1,}').exec('baaaac')).toEqual(new RegExp('a{1,}').exec('baaaac'));
});

test(`new RegExp2('[\\b]').exec('\u0008')`, () => {
    expect(new RegExp2('[\\b]').exec('\u0008')).toEqual(new RegExp('[\\b]').exec('\u0008'));
});

test(`new RegExp2('\\s\\t\\S\\v').exec(' \u0009a\u000B')`, () => {
    expect(new RegExp2('\\s\\t\\S\\v').exec(' \u0009a\u000B')).toEqual(new RegExp('\\s\\t\\S\\v').exec(' \u0009a\u000B'));
});

test(`new RegExp2('\\S\\w*').exec('foo bar.')`, () => {
    expect(new RegExp2('\\S\\w*').exec('foo bar.')).toEqual(new RegExp('\\S\\w*').exec('foo bar.'));
});

test(`new RegExp2('\\s\\w*').exec('foo bar.')`, () => {
    expect(new RegExp2('\\s\\w*').exec('foo bar.')).toEqual(new RegExp('\\s\\w*').exec('foo bar.'));
});

test(`new RegExp2('\\w').exec('$5.28,')`, () => {
    expect(new RegExp2('\\w').exec('$5.28,')).toEqual(new RegExp('\\w').exec('$5.28,'));
});

test(`new RegExp2('\\W').exec('50%')`, () => {
    expect(new RegExp2('\\W').exec('50%')).toEqual(new RegExp('\\W').exec('50%'));
});

test(`new RegExp2('\\0').exec('\u000050%')`, () => {
    expect(new RegExp2('\\0').exec('\u000050%')).toEqual(new RegExp('\\0').exec('\u000050%'));
});
