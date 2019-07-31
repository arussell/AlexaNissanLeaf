# AlexaNissanLeaf
An Alexa Skill to control the Nissan Leaf (and eNV200).

This version contains several improvements not (yet) contained in the version created by ScottHelme. You can [view the changes here](https://github.com/arussell/AlexaNissanLeaf/commits/master).

## Setup instructions
You can follow [Toby Riding's great step-by-step guide on the wiki](https://github.com/arussell/AlexaNissanLeaf/wiki).

## Updating your skill
To update your skill, edit your Lambda and replace the content of index.js and leaf.js with the versions on the [master](https://github.com/arussell/AlexaNissanLeaf) branch.

## Interacting with Alexa
By default you interact with the skill using the invocation name "my car" (you can change this in the skill settings if you prefer something else). For example:

* Alexa, ask *my car*
* Alexa, tell *my car*
* Alexa, launch *my car*

## Commands
The skill has the following features:

* Preheat - Activate the climate control
* Cooling - Activate the climate control
* Climate Control Off - Turn off the climate control
* Update - Download the latest data from the car
* Range - Ask how much range you have
* Battery - Ask how much battery you have
* Charging - Ask if the car is currently charging
* Start Charging - Ask the car to start charging if it is plugged in but not currently charging
* Connected - Ask if the car is connected to a charger

## Examples
These are examples of some of the interactions with Alexa:

* Alexa, ask my car to preheat.
* Alexa, ask my car to warm up.
* Alexa, ask my car to cool down.
* Alexa, ask my car to turn off the climate control.
* Alexa, ask my car how much battery it has.
* Alexa, ask my car how much charge it has.
* Alexa, ask my car how much power it has.
* Alexa, ask my car how much range it has.
* Alexa, ask my car to send an update.
* Alexa, ask my car if it's charging.
* Alexa, ask my car if it's connected to power.
* Alexa, ask my car to start charging.

## Disclaimers

THIS SOFTWARE IS PROVIDED BY THE DEVELOPERS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE DEVELOPERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

In short, your use of this code and any documentation are entirely at your own risk.

Nissan does NOT endorse the use of this software in any way, and will not provide you with any support for using it.
