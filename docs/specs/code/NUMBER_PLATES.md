# Account Number Plates (Checksum IDs)

We need a way for users to clearly distinguish different wallets/accounts in UI without exposing public/private keys. Right now there's absolutely nothing (except the balance and history) that would indicate to a user - whether they opened a correct wallet or not. This causes problems when people open wrong wallets from incorrect mnemonics or incorrect paper passwords and see empty balance and panic thinking their wallet was emptied.

There's no technical option for us to completely eliminate this from happening, just because of how crypto-wallets and BIP39 work. But we can at least provide user with easy and simple tools to try and work around it safely.

As the first step we need to implement a unique account identifier that can be shown in UI in a very easily perceivable way, so users can see it, remember it, print-screen it, and store it somewhere else for later. Unique ID must be generated from *public key* (NOT private) and of course should be completely irreversible.

**⚠️ Note:** more generally, plates are generated using the public deriver level key (see [storage spec](/docs/specs/code/STORAGE.md), which in most cases is the account. We don't have a plate for the wallet as a whole since we have no key for the wallet as a whole in the ad-hoc case

To ensure proper irreversibility on all steps we propose to first take value `H` as `Blake2b_512` (with 64 byte output) of the public key, and then futher work strictly with this value. Note that we can't use the same algorithm as the one for creating an address hash from a public key because in Cardano addresses are generated not just by the public key, but also may need additional parameters depending on the key version, protocol version, etc.

## "Number Plate"

For ease of perception it seems that short alphanumeric sequences are the best for humans to remember, especially when letters and numbers are separated and not mixed together.

Proposed pattern is to take `crc32` checksum of the `H` and then format resulting 4 bytes like this:
```
ABCD-1234
```

First 4 characters are always letters, for this we can take "Shifted HEX" alphabet:

`A B C D E J H K L N O P S T X Z`

16 letter symbols, selected to contain character from all over the alphabet, but not contain characters that look too much like each other (and also carefully selected to minimize possible collision with [this list](https://www.noswearing.com/fourletterwords.php)).

So proposition is just to take first 2 bytes of the checksum and format them with this set of symbols, as with HEX, e.g. byte 0 would be represented as `AA`, and byte 255 - as `ZZ`; byte 132 is `NE`, etc.

For last two bytes - we need to compress to 4 numbers. For this we will simply take the last 4 digits of the 16-bit integer number constructed from 2 bytes as `((A << 8) + B) % 10000`. Experiments show that compared to other (rather naive) approaches - this one produces the perfect result with 10000 unique values across all possible values of A and B and giving maximum of 7 potential collisions per value and 6.5 average collisions per value, which is the minimum, given the fact that we reduce maximum potential number 65025 to 4 digits. **Resulting number is also zero-padded to 4 digits.**

Example code for the whole process:
```
function bytesToId(a,b,c,d) {
  const alpha = `ABCDEHKLNOPSTWXZ`;
  const letters = b => `${alpha[Math.floor(b/16)]}${alpha[b%16]}`;
  const numbers = `${((c<<8)+d)%10000}`.padStart(4,'0');
  return `${letters(a)}${letters(b)}-${numbers}`;
}
```

Where `(a,b,c,d)` are 4 bytes received from calling `CRC32(H)`.

For example, result of calling this function as `bytesToId(25,132,42,18)` is:
```
"BONE-0770"
```

## Icon

Then we will also combine these "number plates" with an icon generated by calling the Blockies library with **`H`** as input (https://github.com/ethereum/blockies). We use this library as it has already been audited by the Ethereum Foundation for cryptographic safety.

Example icons:

![image](https://raw.githubusercontent.com/ethereum/blockies/master/sample.png)

Using `H` and not the checksum or the "number plate" to generate the icon ensures that two wallets with the same number plate potentially might have different icons, adding a little more scurity against collisions.

### Pseudocode example

Pseudocode example including the icon and the Blake2b hash looks like this:

```
function keyToId(key) {
  const hash = blake2b_512(key);
  const [a, b, c, d] = crc32_bytes(hash);
  const plate = bytesToId(a, b, c, d);
  const icon = jdenticon(hash);
  return { plate, icon };
}
```

## UI

For UI, the icon should always be present and visible so the user gets used to it, and starts subconsciously noticing if any small change happens there:

<img width="1438" alt="image" src="https://user-images.githubusercontent.com/2608559/59341180-64cc9d80-8d42-11e9-96d6-72a695cd98ea.png">